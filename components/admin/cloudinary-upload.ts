// Browser side of signed Cloudinary uploads (server side: app/api/upload).

export type UploadFolder = "product-images" | "site-images" | "blog-images";

// Thrown for problems the admin can act on; its message is shown as-is.
export class UploadError extends Error {}

// Ask Cloudinary to pick the best format (WebP/AVIF) and compression per
// browser: lighter pages for the same photo. Derived versions are cached by
// Cloudinary, so this costs one transformation per image, not per view.
function optimizedUrl(secureUrl: string): string {
  return secureUrl.replace("/image/upload/", "/image/upload/f_auto,q_auto/");
}

export async function uploadImage(
  file: File,
  folder: UploadFolder,
  onProgress: (percentage: number) => void
): Promise<string> {
  const signRes = await fetch("/api/upload", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ folder }),
  });
  const signed = await signRes.json().catch(() => ({}));
  if (!signRes.ok) {
    // 503 = not configured, 401 = session expired: both worth showing.
    throw new UploadError(signed.error ?? "Téléversement impossible pour le moment.");
  }

  const form = new FormData();
  for (const [name, value] of Object.entries(signed.fields as Record<string, string | number>)) {
    form.append(name, String(value));
  }
  form.append("file", file);

  // XMLHttpRequest rather than fetch: only it reports upload progress.
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("POST", signed.uploadUrl);
    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable) onProgress(Math.round((event.loaded / event.total) * 100));
    };
    xhr.onload = () => {
      let body: { secure_url?: string; error?: { message?: string } } = {};
      try {
        body = JSON.parse(xhr.responseText);
      } catch {
        // fall through to the generic error below
      }
      if (xhr.status >= 200 && xhr.status < 300 && body.secure_url) {
        resolve(optimizedUrl(body.secure_url));
      } else {
        reject(new Error(body.error?.message ?? `Cloudinary ${xhr.status}`));
      }
    };
    xhr.onerror = () => reject(new Error("network"));
    xhr.send(form);
  });
}
