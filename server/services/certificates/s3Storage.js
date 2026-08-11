import AWS from "aws-sdk";

// Uses existing repo conventions similar to other S3 code.
const s3 = new AWS.S3({ region: process.env.AWS_REGION || "us-east-1" });
const BUCKET = process.env.S3_BUCKET;
const CDN_BASE = process.env.CDN_BASE_URL;

function requireBucket() {
  if (!BUCKET) throw new Error("Missing S3_BUCKET env var");
  return BUCKET;
}

export async function uploadCertificatePdfToS3({ buffer, key }) {
  const bucket = requireBucket();
  await s3
    .putObject({
      Bucket: bucket,
      Key: key,
      Body: buffer,
      ContentType: "application/pdf",
      CacheControl: "public, max-age=31536000, immutable",
    })
    .promise();

  const url = CDN_BASE ? `${CDN_BASE}/${key}` : "";
  return { key, url };
}

export async function uploadQrCodeToS3({ buffer, key }) {
  const bucket = requireBucket();
  await s3
    .putObject({
      Bucket: bucket,
      Key: key,
      Body: buffer,
      ContentType: "image/png",
      CacheControl: "public, max-age=31536000, immutable",
    })
    .promise();

  const url = CDN_BASE ? `${CDN_BASE}/${key}` : "";
  return { key, url };
}

export async function downloadCertificatePdfFromS3({ key }) {
  const bucket = requireBucket();
  const obj = await s3.getObject({ Bucket: bucket, Key: key }).promise();
  return obj.Body;
}

export function getCertificateStreamFromS3({ key }) {
  const bucket = requireBucket();
  return s3.getObject({ Bucket: bucket, Key: key }).createReadStream();
}
