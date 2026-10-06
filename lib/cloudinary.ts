import { createHash } from "crypto";

// Server-only helpers for signed browser uploads to Cloudinary (free plan:
// 25 credits/month, 1 credit = 1 GB stored, 1 GB served, or 1,000
// transformations). The API secret never leaves the server.

type CloudinaryConfig = { cloudName: string; apiKey: string; apiSecret: string };

export function cloudinaryConfig(): CloudinaryConfig | null {
  const { CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET, CLOUDINARY_URL } =
    process.env;
  if (CLOUDINARY_CLOUD_NAME && CLOUDINARY_API_KEY && CLOUDINARY_API_SECRET) {
    return { cloudName: CLOUDINARY_CLOUD_NAME, apiKey: CLOUDINARY_API_KEY, apiSecret: CLOUDINARY_API_SECRET };
  }
  // The dashboard also offers a single CLOUDINARY_URL=cloudinary://key:secret@cloud
  const match = CLOUDINARY_URL?.match(/^cloudinary:\/\/([^:]+):([^@]+)@(.+)$/);
  return match ? { apiKey: match[1], apiSecret: match[2], cloudName: match[3] } : null;
}

// Cloudinary's documented scheme: every signed param except file, api_key,
// cloud_name and resource_type, as sorted name=value pairs joined by "&",
// with the API secret appended, SHA-1 hex digest. Valid for one hour.
export function signParams(params: Record<string, string | number>, apiSecret: string): string {
  const toSign = Object.keys(params)
    .filter((k) => !["file", "api_key", "cloud_name", "resource_type"].includes(k))
    .sort()
    .map((k) => `${k}=${params[k]}`)
    .join("&");
  return createHash("sha1").update(toSign + apiSecret).digest("hex");
}

export function uploadUrl(cloudName: string): string {
  // Overridable so tests can point uploads at a local stand-in.
  return process.env.CLOUDINARY_UPLOAD_URL || `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`;
}
