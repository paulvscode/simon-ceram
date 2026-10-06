// Square product pictures without distortion or cropping (client-safe).
//
// Cloudinary images are padded to a 1:1 canvas (c_pad) whose margins take
// the colour of the photo's own edges (b_auto:border), so the whole piece
// stays visible and the square blends with the shot; then shrunk to at most
// 1200px wide — never enlarged (c_limit), which would blur small uploads.
// Any other URL is returned unchanged and squared in CSS (object-contain on
// the opaque `well` background) by ProductCard.
const CLOUDINARY_UPLOAD = /^(https:\/\/res\.cloudinary\.com\/[^/]+\/image\/upload\/)/;

export function squareImageUrl(url: string): string {
  return url.replace(CLOUDINARY_UPLOAD, "$1c_pad,ar_1:1,b_auto:border/c_limit,w_1200/");
}
