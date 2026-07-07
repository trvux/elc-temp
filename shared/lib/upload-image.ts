import { uploadImageAction } from "@/shared/lib/upload-actions";

/**
 * Uploads an already-processed (WebP) image file/blob under a folder prefix
 * — mirrors the old Supabase Storage folder-per-entity convention — and
 * returns its public URL. Throws on failure so existing call sites'
 * try/catch + toast.error blocks keep working unchanged.
 */
export async function uploadImageFile(file: Blob, folderPath: string, filename = "upload.webp"): Promise<string> {
  const formData = new FormData();
  formData.append("file", file, filename);
  formData.append("folder", folderPath.replace(/\/+$/, ""));

  const { url, error } = await uploadImageAction(formData);
  if (error || !url) {
    throw new Error(error || "Upload failed");
  }
  return url;
}
