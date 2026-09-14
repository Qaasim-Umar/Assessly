import "server-only";

import { GetObjectCommand, PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

const SIGNED_URL_LIFETIME_SECONDS = 120;
const ADMISSION_UPLOAD_URL_LIFETIME_SECONDS = 300;

type R2Config = {
  accountId: string;
  accessKeyId: string;
  secretAccessKey: string;
  bucketName: string;
};

type AdmissionsR2Config = R2Config & {
  publicBaseUrl: string;
};

function getR2Config(): R2Config {
  const config = {
    accountId: process.env.R2_ACCOUNT_ID,
    accessKeyId: process.env.R2_ACCESS_KEY_ID,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
    bucketName: process.env.R2_BUCKET_NAME,
  };

  const missing = Object.entries(config)
    .filter(([, value]) => !value)
    .map(([key]) => key);

  if (missing.length > 0) {
    throw new Error(`Missing private R2 configuration: ${missing.join(", ")}`);
  }

  return config as R2Config;
}

function getAdmissionsR2Config(): AdmissionsR2Config {
  const config = {
    accountId: process.env.R2_ACCOUNT_ID,
    accessKeyId: process.env.ADMISSIONS_R2_ACCESS_KEY_ID,
    secretAccessKey: process.env.ADMISSIONS_R2_SECRET_ACCESS_KEY,
    bucketName: process.env.ADMISSIONS_R2_BUCKET_NAME,
    publicBaseUrl: process.env.ADMISSIONS_R2_PUBLIC_BASE_URL,
  };

  const missing = Object.entries(config)
    .filter(([, value]) => !value)
    .map(([key]) => key);

  if (missing.length > 0) {
    throw new Error(`Missing admissions R2 configuration: ${missing.join(", ")}`);
  }

  return config as AdmissionsR2Config;
}

function createR2Client(config: R2Config) {
  return new S3Client({
    region: "auto",
    endpoint: `https://${config.accountId}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId: config.accessKeyId,
      secretAccessKey: config.secretAccessKey,
    },
  });
}

function safeDownloadName(filename: string) {
  const cleaned = filename
    .normalize("NFKD")
    .replace(/[^a-zA-Z0-9._-]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");

  return cleaned || "question-bank.pdf";
}

export async function createPrivateR2DownloadUrl(
  objectKey: string,
  filename: string,
) {
  const { accountId, accessKeyId, secretAccessKey, bucketName } = getR2Config();
  const client = createR2Client({ accountId, accessKeyId, secretAccessKey, bucketName });
  const command = new GetObjectCommand({
    Bucket: bucketName,
    Key: objectKey,
    ResponseContentDisposition: `attachment; filename="${safeDownloadName(filename)}"`,
  });

  return getSignedUrl(client, command, {
    expiresIn: SIGNED_URL_LIFETIME_SECONDS,
  });
}

export async function createAdmissionImageUploadUrl(
  objectKey: string,
  contentType: string,
) {
  const config = getAdmissionsR2Config();
  const client = createR2Client(config);
  const command = new PutObjectCommand({
    Bucket: config.bucketName,
    Key: objectKey,
    ContentType: contentType,
  });

  const uploadUrl = await getSignedUrl(client, command, {
    expiresIn: ADMISSION_UPLOAD_URL_LIFETIME_SECONDS,
  });
  const publicBaseUrl = config.publicBaseUrl.replace(/\/$/, "");

  return {
    uploadUrl,
    publicUrl: `${publicBaseUrl}/${objectKey}`,
  };
}
