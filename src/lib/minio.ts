import { S3Client } from "@aws-sdk/client-s3";

export const CERTIFICATES_BUCKET = process.env.S3_BUCKET || "certificados";

export const s3 = new S3Client({
  region: process.env.S3_REGION || "us-east-1",
  endpoint: process.env.S3_ENDPOINT || "http://minio:9000",
  forcePathStyle: true,
  credentials: {
    accessKeyId: process.env.S3_ACCESS_KEY || "minioadmin",
    secretAccessKey: process.env.S3_SECRET_KEY || "change-me-now",
  },
});

export const publicS3 = new S3Client({
  region: process.env.S3_REGION || "us-east-1",
  endpoint: process.env.S3_PUBLIC_ENDPOINT || process.env.S3_ENDPOINT || "http://minio:9000",
  forcePathStyle: true,
  credentials: {
    accessKeyId: process.env.S3_ACCESS_KEY || "minioadmin",
    secretAccessKey: process.env.S3_SECRET_KEY || "change-me-now",
  },
});
