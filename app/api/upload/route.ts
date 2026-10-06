import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { handleUpload, type HandleUploadBody } from "@vercel/blob/client";
import { isValidSession, SESSION_COOKIE } from "@/lib/session";

// Client uploads: the browser sends the file straight to Vercel Blob, so
// photos aren't limited by the ~4.5 MB serverless request-body cap. This
// route only issues the short-lived upload token — and only to the admin.
const UPLOAD_FOLDERS = ["product-images/", "site-images/"];

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as HandleUploadBody;
    const result = await handleUpload({
      body,
      request,
      onBeforeGenerateToken: async (pathname) => {
        const session = (await cookies()).get(SESSION_COOKIE)?.value;
        if (!(await isValidSession(session))) {
          throw new Error("Non autorisé.");
        }
        if (!UPLOAD_FOLDERS.some((folder) => pathname.startsWith(folder))) {
          throw new Error("Emplacement non autorisé.");
        }
        return {
          allowedContentTypes: ["image/jpeg", "image/png", "image/webp", "image/gif", "image/avif"],
          maximumSizeInBytes: 20 * 1024 * 1024,
          addRandomSuffix: true,
        };
      },
    });
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Échec du téléversement." },
      { status: 400 }
    );
  }
}
