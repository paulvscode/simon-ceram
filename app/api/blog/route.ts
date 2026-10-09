import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createPost, getAllPosts, parseBlogPostInput } from "@/lib/blog";
import { storageUnavailable } from "@/lib/json-store";
import { isValidSession, SESSION_COOKIE } from "@/lib/session";

async function isAdmin() {
  return isValidSession((await cookies()).get(SESSION_COOKIE)?.value);
}

// Admin: every post, drafts included.
export async function GET() {
  if (!(await isAdmin())) return NextResponse.json({ error: "Non autorisé." }, { status: 401 });
  try {
    return NextResponse.json({ posts: await getAllPosts() });
  } catch (error) {
    return storageUnavailable(error);
  }
}

export async function POST(request: NextRequest) {
  if (!(await isAdmin())) return NextResponse.json({ error: "Non autorisé." }, { status: 401 });
  const parsed = parseBlogPostInput((await request.json().catch(() => ({}))) ?? {});
  if ("error" in parsed) return NextResponse.json({ error: parsed.error }, { status: 400 });
  const post = await createPost(parsed.input);
  return NextResponse.json({ post }, { status: 201 });
}
