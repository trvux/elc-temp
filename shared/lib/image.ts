/**
 * Convert an image File to WebP using the Canvas API (client-side, zero deps).
 * GIF is returned unchanged (animation would flatten to one frame through
 * canvas). An already-WebP file is also returned unchanged, UNLESS
 * `maxDimension` is given and it actually exceeds that — e.g. a lead-form
 * photo attachment wants a size cap regardless of source format, while
 * admin's ImageUpload (calls this with no maxDimension) keeps its exact
 * prior behavior of trusting an existing WebP as-is.
 */
export async function convertToWebP(file: File, quality = 0.85, maxDimension?: number): Promise<File> {
  if (file.type === "image/gif") return file;
  if (file.type === "image/webp" && !maxDimension) return file;

  return new Promise((resolve, reject) => {
    const img = new Image();
    const objectUrl = URL.createObjectURL(file);

    img.onload = () => {
      let width = img.naturalWidth;
      let height = img.naturalHeight;
      if (maxDimension && Math.max(width, height) > maxDimension) {
        const scale = maxDimension / Math.max(width, height);
        width = Math.round(width * scale);
        height = Math.round(height * scale);
      }

      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;

      const ctx = canvas.getContext("2d");
      if (!ctx) {
        URL.revokeObjectURL(objectUrl);
        reject(new Error("Canvas context unavailable"));
        return;
      }

      ctx.drawImage(img, 0, 0, width, height);
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
