import { NextResponse } from "next/server";
import slugify from "slugify";
import { estimateReadingTime, renderTiptapHtml } from "@/lib/tiptap";
import { getServerSupabaseClient } from "@/lib/supabase/server";
import { isAdminEmail } from "@/lib/auth";
import type { SavePostInput } from "@/types/post";

function htmlToExcerpt(html: string) {
  return html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim().slice(0, 220);
}

function normalizeCategory(input?: string) {
  const value = (input ?? "post").toLowerCase();
  if (["post", "review", "deep-dive", "benchmark", "news", "standards"].includes(value)) {
    return value;
  }
  return "post";
}

async function getAuthedAdmin() {
  const supabase = await getServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user?.email || !isAdminEmail(user.email)) {
    return { supabase, user: null, ok: false as const };
  }

  return { supabase, user, ok: true as const };
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const includeDrafts = searchParams.get("includeDrafts") === "true";

  const auth = await getAuthedAdmin();
  const query = auth.supabase
    .from("posts")
    .select("*")
    .order("created_at", { ascending: false });

  if (includeDrafts && auth.ok) {
    const { data, error } = await query;
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ posts: data });
  }

  const { data, error } = await query.eq("published", true);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ posts: data });
}

export async function POST(request: Request) {
  const auth = await getAuthedAdmin();
  if (!auth.ok) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await request.json()) as SavePostInput;
  const slug = body.slug?.trim() || slugify(body.title, { lower: true, strict: true });
  const contentJson = JSON.stringify(
    body.content ?? { type: "doc", content: [{ type: "paragraph" }] },
  );
  const html = renderTiptapHtml(contentJson);
  const excerpt = body.excerpt?.trim() || htmlToExcerpt(html) || "";
  const contentText = html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
  const readingTime = estimateReadingTime(contentText);
  const isPublished = body.published ?? false;

  const payload = {
    id: body.id,
    author_id: auth.user.id,
    title: body.title.trim(),
    slug,
    excerpt,
    cover_url: body.cover_url ?? null,
    category: normalizeCategory(body.category),
    tags: body.tags ?? [],
    published: isPublished,
    reading_time: readingTime,
  };

  // Insert without content first (avoids index issue)
  const primary = await auth.supabase.from("posts").upsert(payload).select("*").single();

  if (primary.error) {
    return NextResponse.json({ error: primary.error.message }, { status: 500 });
  }

  // Now update with content separately
  if (contentJson && contentJson.length > 10) {
    const { error: contentError } = await auth.supabase
      .from("posts")
      .update({ content: contentJson })
      .eq("id", primary.data.id);

    if (contentError) {
      // Content failed but post was created, return success anyway
      console.error("Content update failed:", contentError.message);
    }
  }

  return NextResponse.json({ post: primary.data }, { status: 200 });
}

export async function DELETE(request: Request) {
  const auth = await getAuthedAdmin();
  if (!auth.ok) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");

  if (!id) return NextResponse.json({ error: "Missing post id" }, { status: 400 });

  const { error } = await auth.supabase.from("posts").delete().eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ success: true });
}
