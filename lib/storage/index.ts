import type { StorageProvider } from "./types";
import { SupabaseStorageProvider } from "./supabase-provider";
import { R2StorageProvider } from "./r2-provider";
import { LocalStorageProvider } from "./local-provider";

let instance: StorageProvider | null = null;

/**
 * Returns a singleton StorageProvider based on STORAGE_PROVIDER env var.
 * Supported values: "supabase" (default), "r2", "local".
 * Swapping providers later only requires changing this env var —
 * no application code depends on a specific provider.
 */
export function getStorageProvider(): StorageProvider {
  if (instance) return instance;

  const provider = (process.env.STORAGE_PROVIDER || "supabase").toLowerCase();

  switch (provider) {
    case "r2":
      instance = new R2StorageProvider();
      break;
    case "local":
      instance = new LocalStorageProvider();
      break;
    case "supabase":
    default:
      instance = new SupabaseStorageProvider();
      break;
  }

  return instance;
}

export type { StorageProvider, UploadResult } from "./types";
