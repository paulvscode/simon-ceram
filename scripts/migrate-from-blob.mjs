#!/usr/bin/env node
/*
 * One-time copy of the site's data from the old Vercel Blob store into
 * Upstash Redis, re-hosting Blob images on Cloudinary along the way.
 * Run it once the Blob store is reachable again (it was blocked on the
 * Hobby quota):
 *
 *   node scripts/migrate-from-blob.mjs            # dry run: report only
 *   node scripts/migrate-from-blob.mjs --apply    # copy images + write Redis
 *   node scripts/migrate-from-blob.mjs --apply --force   # also overwrite keys already in Redis
 *
 * Needs BLOB_READ_WRITE_TOKEN, KV_REST_API_URL/TOKEN (or UPSTASH_REDIS_REST_*)
 * and Cloudinary credentials — read from the environment, then .env.local.
 * Blob cost: about one list() per document (~12 advanced operations total).
 */
import fs from "node:fs";
import { createHash } from "node:crypto";
import { list } from "@vercel/blob";
import { Redis } from "@upstash/redis";

const APPLY = process.argv.includes("--apply");
const FORCE = process.argv.includes("--force");

// .env.local, without overriding variables already set in the shell.
if (fs.existsSync(".env.local")) {
  for (const line of fs.readFileSync(".env.local", "utf8").split("\n")) {
    const m = line.match(/^([A-Z0-9_]+)=(.*)$/);
    if (m && process.env[m[1]] === undefined) process.env[m[1]] = m[2].replace(/^["']|["']$/g, "");
  }
}

// Must match lib/json-store.ts.
const KEYS = [
  "products",
  "keywords",
  "orders",
  "contact-messages",
  "shop-settings",
  "home-background",
  "legal",
  "process-section",
];
const LEGACY = {
  products: "products.json",
  keywords: "keywords.json",
  orders: "orders.json",
  "contact-messages": "contact-messages.json",
};

// ---- Cloudinary (same signing as lib/cloudinary.ts) ----
function cloudinaryConfig() {
  const e = process.env;
  if (e.CLOUDINARY_CLOUD_NAME && e.CLOUDINARY_API_KEY && e.CLOUDINARY_API_SECRET) {
    return { cloudName: e.CLOUDINARY_CLOUD_NAME, apiKey: e.CLOUDINARY_API_KEY, apiSecret: e.CLOUDINARY_API_SECRET };
  }
  const m = e.CLOUDINARY_URL?.match(/^cloudinary:\/\/([^:]+):([^@]+)@(.+)$/);
  return m ? { apiKey: m[1], apiSecret: m[2], cloudName: m[3] } : null;
}
function signParams(params, apiSecret) {
  const toSign = Object.keys(params).sort().map((k) => `${k}=${params[k]}`).join("&");
  return createHash("sha1").update(toSign + apiSecret).digest("hex");
}
async function rehostImage(url, folder, cloudinary) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`download ${res.status} ${url}`);
  const params = { folder: `simon-barraud/${folder}`, timestamp: Math.floor(Date.now() / 1000) };
  const form = new FormData();
  for (const [k, v] of Object.entries(params)) form.append(k, String(v));
  form.append("api_key", cloudinary.apiKey);
  form.append("signature", signParams(params, cloudinary.apiSecret));
  form.append("file", await res.blob(), url.split("/").pop());
  const endpoint =
    process.env.CLOUDINARY_UPLOAD_URL || `https://api.cloudinary.com/v1_1/${cloudinary.cloudName}/image/upload`;
  const up = await fetch(endpoint, { method: "POST", body: form });
  const body = await up.json().catch(() => ({}));
  if (!up.ok || !body.secure_url) throw new Error(`cloudinary ${up.status}: ${body.error?.message ?? ""}`);
  return body.secure_url.replace("/image/upload/", "/image/upload/f_auto,q_auto/");
}

// ---- Blob ----
async function readFromBlob(key) {
  const { blobs } = await list({ prefix: `${key}/` });
  const newest = blobs.sort((a, b) => new Date(b.uploadedAt) - new Date(a.uploadedAt))[0];
  let url = newest?.url;
  if (!url && LEGACY[key]) {
    const { blobs: legacy } = await list({ prefix: LEGACY[key], limit: 1 });
    url = legacy.find((b) => b.pathname === LEGACY[key])?.url;
  }
  if (!url) return { data: null, origin: null };
  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) throw new Error(`Blob read failed (${res.status}): ${(await res.text()).slice(0, 80)} — is the store still blocked?`);
  return { data: await res.json(), origin: new URL(url).origin };
}

// Image fields per document, and the Cloudinary folder they go to.
function imageSlots(key, data) {
  if (key === "products" && Array.isArray(data)) {
    return data.flatMap((p) =>
      ["imageUrl", "hoverImageUrl"].map((field) => ({ get: () => p[field], set: (v) => (p[field] = v), folder: "product-images" }))
    );
  }
  if ((key === "home-background" || key === "process-section") && data) {
    return [{ get: () => data.imageUrl, set: (v) => (data.imageUrl = v), folder: "site-images" }];
  }
  return [];
}

// ---- main ----
const cloudinary = cloudinaryConfig();
if (!cloudinary) throw new Error("Cloudinary credentials missing.");
const redis = Redis.fromEnv();
const rehosted = new Map();
console.log(APPLY ? "APPLY mode" : "DRY RUN (add --apply to write)");

for (const key of KEYS) {
  const { data, origin } = await readFromBlob(key);
  if (data === null) {
    console.log(`- ${key}: nothing in Blob, skipped`);
    continue;
  }
  const slots = imageSlots(key, data).filter((s) => s.get() && origin && s.get().startsWith(origin));
  const count = Array.isArray(data) ? `${data.length} entries` : "1 document";
  // Checked before re-hosting, so a kept document doesn't upload images for nothing.
  const exists = (await redis.exists(`site:${key}`)) === 1;
  if (exists && !FORCE) {
    console.log(`- ${key}: ${count}, ${slots.length} Blob image(s) — already in Redis, kept (use --force to overwrite)`);
    continue;
  }
  if (APPLY) {
    for (const slot of slots) {
      const oldUrl = slot.get();
      if (!rehosted.has(oldUrl)) rehosted.set(oldUrl, await rehostImage(oldUrl, slot.folder, cloudinary));
      slot.set(rehosted.get(oldUrl));
    }
    await redis.set(`site:${key}`, data);
  }
  console.log(`- ${key}: ${count}, ${slots.length} Blob image(s) ${APPLY ? "→ copied" : "→ would copy"}`);
}
console.log(APPLY ? `Done. ${rehosted.size} image(s) re-hosted on Cloudinary.` : "Dry run complete.");
if (APPLY) {
  // The site caches reads per deployment and only its own saves invalidate
  // that cache, so it won't see these writes until the next deployment.
  console.log("Next: redeploy the site on Vercel so pages read the copied data (locally: delete .next/cache).");
}
