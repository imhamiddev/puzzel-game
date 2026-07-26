export interface UploadResult {
  url: string;
  path: string;
}

export interface StorageProvider {
  /**
   * Upload a file buffer to storage and return a public URL.
   * @param path Destination path/key, e.g. "rooms/ABC123/piece_1.webp"
   * @param buffer File contents
   * @param contentType MIME type, e.g. "image/webp"
   */
  upload(path: string, buffer: Buffer, contentType: string): Promise<UploadResult>;

  /**
   * Delete a single object by path/key.
   */
  delete(path: string): Promise<void>;

  /**
   * Delete every object whose path starts with the given prefix.
   * Used to clean up all pieces/images for a finished room.
   */
  deletePrefix(prefix: string): Promise<void>;
}
