/**
 * Convert an image File to WebP using the Canvas API (client-side, zero deps).
 * GIF and already-WebP files are returned unchanged.
 */
export async function convertToWebP(file: File, quality = 0.85): Promise<File> {
  if (file.type === "image/gif" || file.type === "image/webp") return file;

  return new Promise((resolve, reject) => {
    const img = new Image();
    const objectUrl = URL.createObjectURL(file);

    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;

      const ctx = canvas.getContext("2d");
      if (!ctx) {
        URL.revokeObjectURL(objectUrl);
        reject(new Error("Canvas context unavailable"));
        return;
      }

      ctx.drawImage(img, 0, 0);
      URL.revokeObjectURL(objectUrl);

      canvas.toBlob(
        (blob) => {
          if (!blob) {
            reject(new Error("toBlob failed"));
            return;
          }
          const name = file.name.replace(/\.[^.]+$/, ".webp");
          resolve(new File([blob], name, { type: "image/webp" }));
        },
        "image/webp",
        quality,
      );
    };

    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error("Image load failed"));
    };

    img.src = objectUrl;
  });
}

/**
 * Optimizes a Supabase storage URL using their transformation service.
 * Changes /object/public/ to /render/image/public/ and adds query params.
 */
export function getOptimizedImage(url: string, width = 1200, quality = 75): string {
  if (!url) return "";
  if (url.includes("supabase.co/storage/v1/object/public/")) {
    const baseUrl = url.replace("/object/public/", "/render/image/public/");
    const params = new URLSearchParams();
    if (width) params.set("width", width.toString());
    if (quality) params.set("quality", quality.toString());
    return `${baseUrl}${params.toString() ? `?${params.toString()}` : ""}`;
  }
  return url;
}
