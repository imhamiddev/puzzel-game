import type { StorageProvider, UploadResult } from "./types";

// Lightweight S3-compatible client for Cloudflare R2 using the AWS SDK v3
// minimal client. Installed lazily so the app builds even if unused.
async function getS3Client() {
  const { S3Client, PutObjectCommand, DeleteObjectCommand, ListObjectsV2Command } =
    await import("@aws-sdk/client-s3");

  const accountId = process.env.R2_ACCOUNT_ID;
  const accessKeyId = process.env.R2_ACCESS_KEY_ID;
  const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY;

  if (!accountId || !accessKeyId || !secretAccessKey) {
    throw new Error(
      "Missing R2 environment variables (R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY)."
    );
  }

  const client = new S3Client({
    region: "auto",
    endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
    credentials: { accessKeyId, secretAccessKey },
  });

  return { client, PutObjectCommand, DeleteObjectCommand, ListObjectsV2Command };
}

export class R2StorageProvider implements StorageProvider {
  private bucket: string;
  private publicUrl: string;

  constructor() {
    this.bucket = process.env.R2_BUCKET || "puzzle-images";
    this.publicUrl = (process.env.R2_PUBLIC_URL || "").replace(/\/$/, "");
  }

  async upload(path: string, buffer: Buffer, contentType: string): Promise<UploadResult> {
    const { client, PutObjectCommand } = await getS3Client();
    await client.send(
      new PutObjectCommand({
        Bucket: this.bucket,
        Key: path,
        Body: buffer,
        ContentType: contentType,
        CacheControl: "public, max-age=31536000",
      })
    );
    return { url: `${this.publicUrl}/${path}`, path };
  }

  async delete(path: string): Promise<void> {
    const { client, DeleteObjectCommand } = await getS3Client();
    await client.send(new DeleteObjectCommand({ Bucket: this.bucket, Key: path }));
  }

  async deletePrefix(prefix: string): Promise<void> {
    const { client, ListObjectsV2Command, DeleteObjectCommand } = await getS3Client();
    const listed = await client.send(
      new ListObjectsV2Command({ Bucket: this.bucket, Prefix: prefix })
    );
    const objects = listed.Contents || [];
    await Promise.all(
      objects
        .filter((o) => !!o.Key)
        .map((o) =>
          client.send(new DeleteObjectCommand({ Bucket: this.bucket, Key: o.Key! }))
        )
    );
  }
}
