import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { cloudinaryConfig, cloudinaryConfigDiagnosis, signParams, uploadUrl } from "@/lib/cloudinary";
import { isValidSession, SESSION_COOKIE } from "@/lib/session";

// Signed browser uploads: the admin's browser sends the photo straight to
// Cloudinary (no 4.5 MB serverless body cap); this route only signs the
// request — and only for the logged-in admin, into an allowed folder.
const UPLOAD_FOLDERS = ["product-images", "site-images"];

export async function POST(request: NextRequest) {
  const session = (await cookies()).get(SESSION_COOKIE)?.value;
  if (!(await isValidSession(session))) {
    return NextResponse.json({ error: "Non autorisé." }, { status: 401 });
  }

  const { folder } = (await request.json().catch(() => ({}))) ?? {};
  if (typeof folder !== "string" || !UPLOAD_FOLDERS.includes(folder)) {
    return NextResponse.json({ error: "Emplacement non autorisé." }, { status: 400 });
  }

  const config = cloudinaryConfig();
  if (!config) {
    return NextResponse.json(
      { error: `Téléversement non configuré (${cloudinaryConfigDiagnosis()}).` },
      { status: 503 }
    );
  }

  // Signed, so the browser can't change them: destination folder and formats.
  const params = {
    folder: `simon-barraud/${folder}`,
    allowed_formats: "jpg,jpeg,png,webp,gif,avif",
    timestamp: Math.floor(Date.now() / 1000),
  };
  return NextResponse.json({
    uploadUrl: uploadUrl(config.cloudName),
    fields: { ...params, api_key: config.apiKey, signature: signParams(params, config.apiSecret) },
  });
}
