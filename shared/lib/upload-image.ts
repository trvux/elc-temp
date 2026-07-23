import { uploadImageAction } from "@/shared/lib/upload-actions";

/**
 * Uploads an already-processed (WebP) image file/blob under a folder prefix
 * — mirrors the old Supabase Storage folder-per-entity convention — and
 * returns its public URL. Throws on failure so existing call sites'
 * try/catch + toast.error blocks keep working unchanged.
 */
export async function uploadImageFile(file: Blob, folderPath: string, filename = "upload.webp"): Promise<string> {
  const { url } = await uploadImageFileWithVariants(file, folderPath, filename);
  return url;
}

// Same upload, but also surfaces cropVariants — only the "products" folder
// populates it server-side (see elc-go's cropVariantsFolder), so every other
// caller can keep using the plain uploadImageFile above unchanged.
export async function uploadImageFileWithVariants(
  file: Blob,
  folderPath: string,
  filename = "upload.webp",
): Promise<{ url: string; cropVariants: Record<string, string> | null }> {
  const formData = new FormData();
  formData.append("file", file, filename);
  formData.append("folder", folderPath.replace(/\/+$/, ""));

  const { url, cropVariants, error } = await uploadImageAction(formData);
  if (error || !url) {
    throw new Error(error || "Upload failed");
  }
  return { url, cropVariants };
}
