// Phone photos are typically 3–12 MB (and HEIC on iPhones, which most
// browsers can't display). Before uploading we downscale to a web-sized JPEG
// in the browser: faster over mobile data, lighter pages, always displayable.

const MAX_EDGE_PX = 2400;
const JPEG_QUALITY = 0.85;
const KEEP_AS_IS_BELOW_BYTES = 2 * 1024 * 1024;
const WEB_TYPES = ["image/jpeg", "image/png", "image/webp", "image/avif"];

// Thrown for problems the admin can act on; its message is shown as-is.
export class ImagePreparationError extends Error {}

export function looksLikeImage(file: File) {
  // Some browsers report HEIC files with an empty type.
  return file.type.startsWith("image/") || /\.(heic|heif)$/i.test(file.name);
}

export async function prepareImageForUpload(file: File): Promise<File> {
  // GIFs may be animated; re-encoding would flatten them.
  if (file.type === "image/gif") return file;

  let bitmap: ImageBitmap;
  try {
    // "from-image" applies the EXIF rotation, so portrait phone shots stay upright.
    bitmap = await createImageBitmap(file, { imageOrientation: "from-image" });
  } catch {
    if (WEB_TYPES.includes(file.type)) return file; // let the upload proceed untouched
    throw new ImagePreparationError(
      "Ce format de photo n’est pas lisible par ce navigateur. Enregistrez-la en JPEG puis réessayez."
    );
  }

  const scale = Math.min(1, MAX_EDGE_PX / Math.max(bitmap.width, bitmap.height));
  if (scale === 1 && WEB_TYPES.includes(file.type) && file.size <= KEEP_AS_IS_BELOW_BYTES) {
    bitmap.close();
    return file;
  }

  const canvas = document.createElement("canvas");
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);
  const context = canvas.getContext("2d");
  if (!context) {
    bitmap.close();
    return file;
  }
  // JPEG has no transparency: flatten onto white rather than black.
  context.fillStyle = "#ffffff";
  context.fillRect(0, 0, canvas.width, canvas.height);
  context.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close();

  const blob = await new Promise<Blob | null>((resolve) =>
    canvas.toBlob(resolve, "image/jpeg", JPEG_QUALITY)
  );
  if (!blob) return file;

  const baseName = file.name.replace(/\.[^.]+$/, "") || "image";
  return new File([blob], `${baseName}.jpg`, { type: "image/jpeg" });
}
