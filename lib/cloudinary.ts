import { createHash } from "crypto";

// Server-only helpers for signed browser uploads to Cloudinary (free plan:
// 25 credits/month, 1 credit = 1 GB stored, 1 GB served, or 1,000
// transformations). The API secret never leaves the server.

type CloudinaryConfig = { cloudName: string; apiKey: string; apiSecret: string };

const REQUIRED = ["CLOUDINARY_CLOUD_NAME", "CLOUDINARY_API_KEY", "CLOUDINARY_API_SECRET"] as const;

// Values pasted into a hosting dashboard often keep the quotes or a trailing
// space from a .env file; neither is ever part of a real Cloudinary value.
function clean(value: string | undefined): string {
  return (value ?? "").trim().replace(/^["']|["']$/g, "").trim();
}

export function cloudinaryConfig(): CloudinaryConfig | null {
  const [cloudName, apiKey, apiSecret] = REQUIRED.map((name) => clean(process.env[name]));
  if (cloudName && apiKey && apiSecret) return { cloudName, apiKey, apiSecret };
  // The dashboard also offers a single CLOUDINARY_URL=cloudinary://key:secret@cloud
  const match = clean(process.env.CLOUDINARY_URL).match(/^cloudinary:\/\/([^:]+):([^@]+)@(.+)$/);
  return match ? { apiKey: match[1], apiSecret: match[2], cloudName: match[3] } : null;
}

/**
 * For the "not configured" message: which required names are missing, and
 * which Cloudinary-looking names ARE present (a typo, lowercase, a stray
 * space). Variable names only — never values.
 */
export function cloudinaryConfigDiagnosis(): string {
  const missing = REQUIRED.filter((name) => !clean(process.env[name]));
  const lookalikes = Object.keys(process.env).filter(
    (name) => /cloudinary/i.test(name) && !(REQUIRED as readonly string[]).includes(name)
  );
  return [
    missing.length ? `manquantes sur le serveur : ${missing.join(", ")}` : "",
    lookalikes.length ? `noms trouvés qui ressemblent : ${lookalikes.map((n) => JSON.stringify(n)).join(", ")}` : "",
  ]
    .filter(Boolean)
    .join(" — ");
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
