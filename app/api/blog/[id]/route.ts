import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { deletePost, getPostById, parseBlogPostInput, updatePost } from "@/lib/blog";
import { storageUnavailable } from "@/lib/json-store";
import { isValidSession, SESSION_COOKIE } from "@/lib/session";

type Context = { params: Promise<{ id: string }> };

async function isAdmin() {
  return isValidSession((await cookies()).get(SESSION_COOKIE)?.value);
}

// Admin: a post with its content, for the editor (drafts included).
export async function GET(_request: NextRequest, { params }: Context) {
  if (!(await isAdmin())) return NextResponse.json({ error: "Non autorisé." }, { status: 401 });
  try {
    const post = await getPostById((await params).id);
    return post ? NextResponse.json({ post }) : NextResponse.json({ error: "Article introuvable." }, { status: 404 });
  } catch (error) {
    return storageUnavailable(error);
  }
}

export async function PUT(request: NextRequest, { params }: Context) {
  if (!(await isAdmin())) return NextResponse.json({ error: "Non autorisé." }, { status: 401 });
  const parsed = parseBlogPostInput((await request.json().catch(() => ({}))) ?? {});
  if ("error" in parsed) return NextResponse.json({ error: parsed.error }, { status: 400 });
  const post = await updatePost((await params).id, parsed.input);
  return post ? NextResponse.json({ post }) : NextResponse.json({ error: "Article introuvable." }, { status: 404 });
}

export async function DELETE(_request: NextRequest, { params }: Context) {
  if (!(await isAdmin())) return NextResponse.json({ error: "Non autorisé." }, { status: 401 });
  await deletePost((await params).id);
  return NextResponse.json({ ok: true });
}
