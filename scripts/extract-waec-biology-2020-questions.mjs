import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

const SUBJECT_SLUG = (process.argv[3] ?? "biology").trim().toLowerCase();
const SUBJECT_NAME = SUBJECT_SLUG.replace(/(^|-)([a-z])/g, (_, separator, letter) => `${separator}${letter.toUpperCase()}`);
const EXAM_TYPE = "waec";
const EXAM_YEAR = Number.parseInt(process.argv[2] ?? "2020", 10);
if (!Number.isInteger(EXAM_YEAR)) throw new Error("Pass a valid four-digit exam year.");
const OUTPUT_DIR = path.resolve("artifacts", `${EXAM_TYPE}-${SUBJECT_SLUG}-${EXAM_YEAR}`);
const OUTPUT_PATH = path.join(
  OUTPUT_DIR,
  `${EXAM_TYPE}-${SUBJECT_SLUG}-${EXAM_YEAR}-original-questions.json`,
);
const MANIFEST_PATH = path.join(OUTPUT_DIR, "image-manifest.json");

const requestHeaders = {
  "user-agent": "Mozilla/5.0 (compatible; AssesslyContentImporter/1.0)",
  accept: "text/html,application/xhtml+xml,*/*",
};

async function fetchOk(url) {
  let lastError;
  for (let attempt = 1; attempt <= 4; attempt += 1) {
    try {
      const response = await fetch(url, { headers: requestHeaders, redirect: "follow" });
      if (!response.ok) throw new Error(`${response.status} ${response.statusText}: ${url}`);
      return await response.text();
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

function decodeEntities(value) {
  const named = {
    amp: "&",
    apos: "'",
    beta: "β",
    deg: "°",
    eacute: "é",
    frac12: "½",
    fnof: "ƒ",
    gt: ">",
    hellip: "…",
    iexcl: "i",
    ldquo: "“",
    lambda: "λ",
    lsquo: "‘",
    lt: "<",
    mdash: "—",
    mu: "μ",
    nbsp: " ",
    ndash: "–",
    omega: "Ω",
    ordm: "°",
    pi: "π",
    quot: '"',
    rarr: "→",
    rdquo: "”",
    rho: "ρ",
    rsquo: "’",
    scaron: "š",
    theta: "θ",
    times: "×",
  };

  return value
    .replace(/&#x([0-9a-f]+);/gi, (_, hex) => String.fromCodePoint(Number.parseInt(hex, 16)))
    .replace(/&#(\d+);/g, (_, decimal) => String.fromCodePoint(Number.parseInt(decimal, 10)))
    .replace(/&([a-z][a-z0-9]*);/gi, (match, entity) => named[entity.toLowerCase()] ?? match);
}

function htmlToText(value) {
  const decoded = decodeEntities(value);
  return decodeEntities(
    decoded
      .replace(/<!--[\s\S]*?-->/g, " ")
      .replace(/<\s*br\s*\/?>/gi, "\n")
      .replace(/<\/(?:p|div|li|tr|table|h\d)>/gi, "\n")
      .replace(/<img\b[^>]*>/gi, " ")
      .replace(/<img\b[\s\S]*$/i, " ")
      .replace(/<[^>]+>/g, " "),
  )
    .replace(/\r/g, "")
    .replace(/[\t ]+/g, " ")
    .replace(/ *\n */g, "\n")
    .replace(/\n{2,}/g, "\n")
    .trim();
}

function questionIdsFromListing(html) {
  const escapedSubject = SUBJECT_SLUG.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return unique(
    [...html.matchAll(new RegExp(`/classroom/${escapedSubject}/(\\d+)`, "g"))].map((match) => match[1]),
  ).slice(0, 5);
}

function parseQuestionPage(html, number, sourceUrl, correctOptionOverride) {
  const rendered = html.replace(/<script\b[\s\S]*?<\/script>|<style\b[\s\S]*?<\/style>/gi, "");
  const heading = rendered.match(/<h1\b[^>]*>([\s\S]*?)<\/h1>/i);
  if (!heading) throw new Error(`Question ${number}: question heading not found (${sourceUrl}).`);

  const headingEnd = heading.index + heading[0].length;
  const controlsIndex = rendered.indexOf("Download Offline App", headingEnd);
  const optionSection = rendered.slice(headingEnd, controlsIndex === -1 ? undefined : controlsIndex);
  const optionPattern = /<div class="([^"]*\bflex gap-6 items-center rounded-lg\b[^"]*)"><div class="flex items-center gap-6"><span[^>]*>([a-d])<\/span><p[^>]*>([\s\S]*?)<\/p><\/div>/gi;
  const matches = [...optionSection.matchAll(optionPattern)];
  const options = matches
    .map((match) => ({
      key: match[2].toUpperCase(),
      text: htmlToText(match[3]),
      is_correct: match[1].includes("bg-[#DFFFEC]"),
    }))
    .filter((option, index, allOptions) => index === allOptions.findIndex((candidate) => (
      candidate.key === option.key
      && candidate.text === option.text
      && candidate.is_correct === option.is_correct
    )));

  if (correctOptionOverride) {
    options.forEach((option) => {
      option.is_correct = option.key === correctOptionOverride;
    });
  }

  if (options.length !== 4) {
    throw new Error(`Question ${number}: expected 4 options, found ${options.length} (${sourceUrl}).`);
  }
  if (options.filter((option) => option.is_correct).length !== 1) {
    throw new Error(`Question ${number}: expected exactly one correct option (${sourceUrl}).`);
  }

  return {
    question: htmlToText(heading[1]),
    options,
  };
}

function parseTheoryPage(html, number, sourceUrl) {
  const rendered = html.replace(/<script\b[\s\S]*?<\/script>|<style\b[\s\S]*?<\/style>/gi, "");
  const heading = rendered.match(/<h1\b[^>]*>([\s\S]*?)<\/h1>/i);
  if (!heading) throw new Error(`Theory ${number}: question heading not found (${sourceUrl}).`);
  const question = htmlToText(heading[1]);
  if (!question) throw new Error(`Theory ${number}: question text is empty (${sourceUrl}).`);
  return { number, question };
}

let imageManifest = { questions: [] };
try {
  imageManifest = JSON.parse(await readFile(MANIFEST_PATH, "utf8"));
} catch (error) {
  if (error?.code !== "ENOENT") throw error;
}
const objectiveImageEntries = imageManifest.questions.filter(
  (question) => !question.section || question.section === "objective",
);
const objectiveImagesByNumber = new Map(
  objectiveImageEntries.map((question) => [question.number, question.images ?? []]),
);
const objectiveImagesBySourceId = new Map(
  objectiveImageEntries.map((question) => [String(question.sourceId), question.images ?? []]),
);
const diagramQuestionNumbers = new Set(objectiveImageEntries.map((question) => question.number));
const diagramSourceIds = new Set(objectiveImageEntries.map((question) => String(question.sourceId)));
const sharedDiagramMappings = {
  "biology:2020": [
    [21, 20],
    [32, 31],
    [46, 47],
  ],
  "chemistry:2021": [
    [43, 42],
  ],
};
const sharedDiagramSource = new Map(
  sharedDiagramMappings[`${SUBJECT_SLUG}:${EXAM_YEAR}`] ?? [],
);
const sourceCorrectOptionOverrides = new Map([
  ["chemistry:2022:65876", "C"],
  ["economics:2015:49407", "D"],
  ["government:2024:71870", "C"],
]);

const sourcePages = [];
for (let page = 1; page <= 30; page += 1) {
  const listingUrl = `https://myschool.ng/classroom/${SUBJECT_SLUG}?exam_type=${EXAM_TYPE}&exam_year=${EXAM_YEAR}&page=${page}`;
  const ids = questionIdsFromListing(await fetchOk(listingUrl));
  if (ids.length === 0 && page > 10) break;
  if (page <= 9 && ids.length !== 5) {
    throw new Error(`Expected 5 objective questions on listing page ${page}, found ${ids.length}.`);
  }
  ids.forEach((sourceId) => {
    sourcePages.push({
      sourceId,
      sourceUrl: `https://myschool.ng/classroom/${SUBJECT_SLUG}/${sourceId}`,
    });
  });
}

const questions = [];
const theoryQuestions = [];
const objectiveSignatures = new Set();
const theorySignatures = new Set();
for (const item of sourcePages) {
  const html = await fetchOk(item.sourceUrl);
  const optionCount = (html.match(/flex gap-6 items-center rounded-lg/g) ?? []).length;
  if (optionCount >= 4) {
    const number = questions.length + 1;
    const correctOptionOverride = sourceCorrectOptionOverrides.get(
      `${SUBJECT_SLUG}:${EXAM_YEAR}:${item.sourceId}`,
    );
    const parsed = parseQuestionPage(html, number, item.sourceUrl, correctOptionOverride);
    const signature = JSON.stringify([
      parsed.question.trim().toLowerCase(),
      parsed.options.map((option) => [
        option.key,
        option.text.trim().toLowerCase(),
        option.is_correct,
      ]),
    ]);
    if (objectiveSignatures.has(signature)) continue;
    objectiveSignatures.add(signature);
    const mappedDiagramNumber = sharedDiagramSource.get(number) ?? number;
    const imageUrl = (
      objectiveImagesBySourceId.get(String(item.sourceId))
      ?? objectiveImagesByNumber.get(mappedDiagramNumber)
    )?.[0]?.publicUrl;
    const hasMissingOptionGraphics = parsed.options.every(
      (option) => option.text.trim().toUpperCase() === option.key,
    );
    const referencesDiagram = (
      /\b(?:diagram|figure|illustration)\s+(?:above|below)\b/i.test(parsed.question)
      || /\b(?:study|use|refer to)\s+(?:the\s+)?(?:diagram|figure|illustration)\b/i.test(parsed.question)
    );
    const hasDiagram = Boolean(imageUrl)
      || diagramQuestionNumbers.has(number)
      || diagramSourceIds.has(String(item.sourceId))
      || referencesDiagram
      || hasMissingOptionGraphics;
    questions.push({
      number,
      question: parsed.question,
      ...(hasDiagram ? {
        has_diagram: true,
        diagram_note: imageUrl
          ? `Use the uploaded diagram mapped to question ${mappedDiagramNumber}.`
          : "The source references option graphics, but no image file is available.",
      } : {}),
      ...(imageUrl ? { image_url: imageUrl } : {}),
      options: parsed.options,
    });
    continue;
  }

  const number = theoryQuestions.length + 1;
  const parsed = parseTheoryPage(html, number, item.sourceUrl);
  const theorySignature = parsed.question.trim().toLowerCase();
  if (theorySignatures.has(theorySignature)) continue;
  theorySignatures.add(theorySignature);
  const imageEntry = imageManifest.questions.find(
    (question) => question.section === "theory"
      && String(question.sourceId) === String(item.sourceId),
  ) ?? imageManifest.questions.find(
    (question) => question.section === "theory" && question.number === number,
  );
  const firstImage = imageEntry?.images?.[0];
  const imageUrl = firstImage?.bytes >= 256 ? firstImage.publicUrl : undefined;
  const referencesProvidedDiagram = /(?:diagram|figure|illustration).{0,40}\b(?:above|below|given|shown|illustrated)\b|\b(?:above|below|given|shown|illustrated).{0,40}(?:diagram|figure|illustration)|\bfig(?:ure)?\.?\s*\d/i.test(parsed.question);
  const hasDiagram = Boolean(firstImage) || referencesProvidedDiagram;
  theoryQuestions.push({
    ...parsed,
    ...(hasDiagram ? {
      has_diagram: true,
      diagram_note: imageUrl
        ? `Use the uploaded theory/practical image(s) mapped to question ${number}.`
        : "The source references a diagram, but no usable image file is available.",
    } : {}),
    ...(imageUrl ? { image_url: imageUrl } : {}),
  });
}

const output = {
  subject: SUBJECT_NAME,
  year: EXAM_YEAR,
  exam_type: EXAM_TYPE,
  questions,
  theory_questions: theoryQuestions,
};

await mkdir(OUTPUT_DIR, { recursive: true });
await writeFile(OUTPUT_PATH, `${JSON.stringify(output, null, 2)}\n`, "utf8");

console.log(JSON.stringify({
  outputPath: OUTPUT_PATH,
  questionCount: questions.length,
  diagramQuestionCount: questions.filter((question) => question.has_diagram).length,
  objectiveImageUrlCount: questions.filter((question) => question.image_url).length,
  theoryQuestionCount: theoryQuestions.length,
  theoryImageUrlCount: theoryQuestions.filter((question) => question.image_url).length,
}, null, 2));
