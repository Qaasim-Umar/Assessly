import { DeleteObjectCommand, PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { createHash } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

const SUBJECT_SLUG = (process.argv[3] ?? "biology").trim().toLowerCase();
const SUBJECT_NAME = SUBJECT_SLUG.replace(/(^|-)([a-z])/g, (_, separator, letter) => `${separator}${letter.toUpperCase()}`);
const EXAM_TYPE = "waec";
const EXAM_YEAR = Number.parseInt(process.argv[2] ?? "2020", 10);
if (!Number.isInteger(EXAM_YEAR)) throw new Error("Pass a valid four-digit exam year.");
const OBJECT_PREFIX = `question-assets/${EXAM_TYPE}/${SUBJECT_SLUG}/${EXAM_YEAR}`;
const OUTPUT_DIR = path.resolve("artifacts", `${EXAM_TYPE}-${SUBJECT_SLUG}-${EXAM_YEAR}`);
const MANIFEST_PATH = path.join(OUTPUT_DIR, "image-manifest.json");

const requiredEnv = [
  "R2_ACCOUNT_ID",
  "ADMISSIONS_R2_ACCESS_KEY_ID",
  "ADMISSIONS_R2_SECRET_ACCESS_KEY",
  "ADMISSIONS_R2_BUCKET_NAME",
  "ADMISSIONS_R2_PUBLIC_BASE_URL",
];

for (const name of requiredEnv) {
  if (!process.env[name]) throw new Error(`Missing required environment variable: ${name}`);
}

const r2 = new S3Client({
  region: "auto",
  endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.ADMISSIONS_R2_ACCESS_KEY_ID,
    secretAccessKey: process.env.ADMISSIONS_R2_SECRET_ACCESS_KEY,
  },
});

const requestHeaders = {
  "user-agent": "Mozilla/5.0 (compatible; AssesslyContentImporter/1.0)",
  accept: "text/html,application/xhtml+xml,image/avif,image/webp,image/png,image/jpeg,*/*",
};

async function fetchOk(url) {
  let lastError;
  for (let attempt = 1; attempt <= 4; attempt += 1) {
    try {
      const response = await fetch(url, { headers: requestHeaders, redirect: "follow" });
      if (!response.ok) throw new Error(`${response.status} ${response.statusText}: ${url}`);
      return response;
    } catch (error) {
      lastError = error;
      if (attempt < 4) {
        await new Promise((resolve) => setTimeout(resolve, attempt * 750));
      }
    }
  }
  throw lastError;
}

function unique(values) {
  return [...new Set(values)];
}

function questionIdsFromListing(html) {
  const escapedSubject = SUBJECT_SLUG.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return unique(
    [...html.matchAll(new RegExp(`/classroom/${escapedSubject}/(\\d+)`, "g"))].map((match) => match[1]),
  );
}

function classroomImagesFromQuestion(html) {
  return unique(
    [...html.matchAll(/https:\/\/myschool\.ng\/storage\/classroom\/[^"'\\\s<]+\.(?:png|jpe?g|webp)/gi)]
      .map((match) => match[0].replaceAll("&amp;", "&")),
  );
}

function extensionFor(contentType, sourceUrl) {
  const type = contentType.toLowerCase().split(";")[0].trim();
  if (type === "image/jpeg") return "jpg";
  if (type === "image/png") return "png";
  if (type === "image/webp") return "webp";
  const sourceExtension = new URL(sourceUrl).pathname.split(".").pop()?.toLowerCase();
  if (["jpg", "jpeg", "png", "webp"].includes(sourceExtension)) {
    return sourceExtension === "jpeg" ? "jpg" : sourceExtension;
  }
  throw new Error(`Unsupported image type '${contentType}' from ${sourceUrl}`);
}

function imageContentType(contentType, extension) {
  const type = contentType.toLowerCase().split(";")[0].trim();
  if (["image/jpeg", "image/png", "image/webp"].includes(type)) return type;
  if (extension === "jpg") return "image/jpeg";
  if (extension === "png") return "image/png";
  if (extension === "webp") return "image/webp";
  throw new Error(`Cannot determine image content type for extension '${extension}'.`);
}

const questionPages = [];
for (let page = 1; page <= 30; page += 1) {
  const listingUrl = `https://myschool.ng/classroom/${SUBJECT_SLUG}?exam_type=${EXAM_TYPE}&exam_year=${EXAM_YEAR}&page=${page}`;
  const html = await (await fetchOk(listingUrl)).text();
  const ids = questionIdsFromListing(html).slice(0, 5);
  if (ids.length === 0 && page > 10) break;
  if (page <= 10 && ids.length !== 5) {
    throw new Error(`Expected 5 objective questions on page ${page}, found ${ids.length}.`);
  }
  ids.forEach((sourceId, index) => {
    questionPages.push({
      sourceId,
      sourceUrl: `https://myschool.ng/classroom/${SUBJECT_SLUG}/${sourceId}`,
    });
  });
}

const mappings = [];
let objectiveNumber = 0;
let theoryNumber = 0;
for (const question of questionPages) {
  const html = await (await fetchOk(question.sourceUrl)).text();
  const isObjective = (html.match(/flex gap-6 items-center rounded-lg/g) ?? []).length >= 4;
  question.section = isObjective ? "objective" : "theory";
  question.number = isObjective ? ++objectiveNumber : ++theoryNumber;
  const imageUrls = classroomImagesFromQuestion(html);
  for (const sourceImageUrl of imageUrls) {
    mappings.push({ ...question, sourceImageUrl });
  }
}

const uploadsBySource = new Map();
const uploadsByContent = new Map();
for (const sourceImageUrl of unique(mappings.map((item) => item.sourceImageUrl))) {
  const response = await fetchOk(sourceImageUrl);
  const body = Buffer.from(await response.arrayBuffer());
  const contentType = response.headers.get("content-type") ?? "application/octet-stream";
  const extension = extensionFor(contentType, sourceImageUrl);
  const normalizedContentType = imageContentType(contentType, extension);
  const sourceName = path.basename(new URL(sourceImageUrl).pathname).replace(/\.[^.]+$/, "");
  // 2020 keeps its v2 keys because its original objects were cached with stale MIME metadata.
  const versionSuffix = EXAM_YEAR === 2020 && SUBJECT_SLUG === "biology" ? "-v2" : "";
  const objectKey = `${OBJECT_PREFIX}/${sourceName}${versionSuffix}.${extension}`;
  const contentHash = createHash("sha256").update(body).digest("hex");
  const existingUpload = uploadsByContent.get(contentHash);

  if (existingUpload) {
    uploadsBySource.set(sourceImageUrl, existingUpload);
    if (objectKey !== existingUpload.objectKey) {
      await r2.send(new DeleteObjectCommand({
        Bucket: process.env.ADMISSIONS_R2_BUCKET_NAME,
        Key: objectKey,
      }));
    }
    continue;
  }

  await r2.send(new PutObjectCommand({
    Bucket: process.env.ADMISSIONS_R2_BUCKET_NAME,
    Key: objectKey,
    Body: body,
    ContentType: normalizedContentType,
    CacheControl: "public, max-age=31536000, immutable",
  }));

  const publicBaseUrl = process.env.ADMISSIONS_R2_PUBLIC_BASE_URL.replace(/\/$/, "");
  const upload = {
    objectKey,
    publicUrl: `${publicBaseUrl}/${objectKey}`,
    contentType: normalizedContentType,
    bytes: body.length,
  };
  uploadsByContent.set(contentHash, upload);
  uploadsBySource.set(sourceImageUrl, upload);
}

const questions = questionPages.map((question) => ({
  ...question,
  images: mappings
    .filter((item) => item.section === question.section && item.number === question.number)
    .map((item) => ({
      sourceUrl: item.sourceImageUrl,
      ...uploadsBySource.get(item.sourceImageUrl),
    })),
}));

const manifest = {
  subject: SUBJECT_NAME,
  examType: "WAEC",
  year: EXAM_YEAR,
  objectiveQuestionCount: questionPages.filter((question) => question.section === "objective").length,
  theoryQuestionCount: questionPages.filter((question) => question.section === "theory").length,
  questionsWithImages: questions.filter((question) => question.images.length > 0).length,
  uniqueImagesUploaded: uploadsByContent.size,
  objectPrefix: OBJECT_PREFIX,
  generatedAt: new Date().toISOString(),
  questions: questions.filter((question) => question.images.length > 0),
};

await mkdir(OUTPUT_DIR, { recursive: true });
await writeFile(MANIFEST_PATH, `${JSON.stringify(manifest, null, 2)}\n`, "utf8");

console.log(JSON.stringify({
  manifestPath: MANIFEST_PATH,
  questionsWithImages: manifest.questionsWithImages,
  uniqueImagesUploaded: manifest.uniqueImagesUploaded,
  objectPrefix: OBJECT_PREFIX,
}, null, 2));
