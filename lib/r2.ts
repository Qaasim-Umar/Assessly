import "server-only";

import { GetObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

const SIGNED_URL_LIFETIME_SECONDS = 120;

type R2Config = {
  accountId: string;
  accessKeyId: string;
  secretAccessKey: string;
  bucketName: string;
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
  const client = new S3Client({
    region: "auto",
    endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
    credentials: { accessKeyId, secretAccessKey },
  });
  const command = new GetObjectCommand({
    Bucket: bucketName,
    Key: objectKey,
    ResponseContentDisposition: `attachment; filename="${safeDownloadName(filename)}"`,
  });

  return getSignedUrl(client, command, {
    expiresIn: SIGNED_URL_LIFETIME_SECONDS,
  });
}

