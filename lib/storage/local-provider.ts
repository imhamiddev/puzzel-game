import { mkdir, writeFile, rm, unlink } from "fs/promises";
import path from "path";
import type { StorageProvider, UploadResult } from "./types";

// Stores files under public/uploads so Next.js can serve them statically.
// NOTE: on serverless platforms like Vercel the filesystem is ephemeral/read-only
// outside /tmp, so this provider is intended for local development only.
const ROOT = path.join(process.cwd(), "public", "uploads");

export class LocalStorageProvider implements StorageProvider {
  async upload(filePath: string, buffer: Buffer): Promise<UploadResult> {
    const fullPath = path.join(ROOT, filePath);
    await mkdir(path.dirname(fullPath), { recursive: true });
    await writeFile(fullPath, buffer);
    return { url: `/uploads/${filePath}`, path: filePath };
  }

  async delete(filePath: string): Promise<void> {
    try {
      await unlink(path.join(ROOT, filePath));
    } catch {
      // ignore missing file
    }
  }

  async deletePrefix(prefix: string): Promise<void> {
    try {
      await rm(path.join(ROOT, prefix), { recursive: true, force: true });
    } catch {
      // ignore
    }
  }
}
