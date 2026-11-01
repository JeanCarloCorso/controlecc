import { S3Client } from "@aws-sdk/client-s3";

type StorageConfig = { endpoint: string; region: string; bucket: string; accessKeyId: string; secretAccessKey: string };

function storageConfig(): StorageConfig {
  const endpoint = process.env.S3_ENDPOINT;
  const region = process.env.S3_REGION;
  const bucket = process.env.S3_BUCKET;
  const accessKeyId = process.env.S3_ACCESS_KEY;
  const secretAccessKey = process.env.S3_SECRET_KEY;
  if (!endpoint || !region || !bucket || !accessKeyId || !secretAccessKey) throw new Error("Configuração do armazenamento S3 incompleta");
  return { endpoint, region, bucket, accessKeyId, secretAccessKey };
}

function createClient(endpoint: string, config: StorageConfig) {
  return new S3Client({ region: config.region, endpoint, forcePathStyle: true, credentials: { accessKeyId: config.accessKeyId, secretAccessKey: config.secretAccessKey } });
}

export function getStorageClients() {
  const config = storageConfig();
  const publicEndpoint = process.env.S3_PUBLIC_ENDPOINT;
  if (!publicEndpoint) throw new Error("S3_PUBLIC_ENDPOINT não configurado");
  return { bucket: config.bucket, internal: createClient(config.endpoint, config), public: createClient(publicEndpoint, config) };
}
