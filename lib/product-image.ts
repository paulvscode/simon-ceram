// Product picture URLs (client-safe).
//
// Pictures are shown whole inside a square frame by ProductCard
// (object-contain on the neutral `well` background) — never stretched or
// cropped, and with no colour fill. For Cloudinary images this only caps the
// width at 1200px; c_limit never enlarges, which would blur small uploads.
const CLOUDINARY_UPLOAD = /^(https:\/\/res\.cloudinary\.com\/[^/]+\/image\/upload\/)/;

export function productImageUrl(url: string): string {
  return url.replace(CLOUDINARY_UPLOAD, "$1c_limit,w_1200/");
}
