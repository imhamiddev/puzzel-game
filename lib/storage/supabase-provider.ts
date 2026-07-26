import { createClient } from "@supabase/supabase-js";
import type { StorageProvider, UploadResult } from "./types";

function getClient() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error(
      "Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY environment variables."
    );
  }
  return createClient(url, key, {
    auth: { persistSession: false },
  });
}

export class SupabaseStorageProvider implements StorageProvider {
  private bucket: string;

  constructor() {
    this.bucket = process.env.SUPABASE_BUCKET || "puzzle-images";
  }

  async upload(path: string, buffer: Buffer, contentType: string): Promise<UploadResult> {
    const supabase = getClient();
    const { error } = await supabase.storage.from(this.bucket).upload(path, buffer, {
      contentType,
      upsert: true,
      cacheControl: "31536000",
    });
    if (error) {
      throw new Error(`Supabase upload failed for ${path}: ${error.message}`);
    }
    const { data } = supabase.storage.from(this.bucket).getPublicUrl(path);
    return { url: data.publicUrl, path };
  }

  async delete(path: string): Promise<void> {
    const supabase = getClient();
    await supabase.storage.from(this.bucket).remove([path]);
  }

  async deletePrefix(prefix: string): Promise<void> {
    const supabase = getClient();
    const { data: files, error } = await supabase.storage.from(this.bucket).list(prefix);
    if (error || !files || files.length === 0) return;
    const paths = files.map((f) => `${prefix}/${f.name}`);
    await supabase.storage.from(this.bucket).remove(paths);
  }
}
