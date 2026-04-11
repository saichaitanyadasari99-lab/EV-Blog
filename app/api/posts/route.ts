import { NextResponse } from "next/server";
import slugify from "slugify";
import { estimateReadingTime, renderTiptapHtml } from "@/lib/tiptap";
import { getServerSupabaseClient } from "@/lib/supabase/server";
import { isAdminEmail } from "@/lib/auth";
import type { SavePostInput } from "@/types/post";

function htmlToExcerpt(html: string) {
  return html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim().slice(0, 220);
}

async function normalizeCategory(supabase: Awaited<ReturnType<typeof getServerSupabaseClient>>, input?: string) {
  const value = (input ?? "cell-chemistry").toLowerCase().trim();
  
  const categoryMap: Record<string, string> = {
    "benchmark": "ev-benchmarks",
    "benchmarks": "ev-benchmarks",
    "benchmarking": "ev-benchmarks",
    "review": "vehicle-reviews",
    "reviews": "vehicle-reviews",
    "deep-dive": "bms-design",
    "deep dives": "bms-design",
    "post": "cell-chemistry",
    "posts": "cell-chemistry",
    "standards": "standards",
    "news": "news",
  };
  
  const slug = categoryMap[value] || value.replace(/\s+/g, "-");
  
  const { data: existing } = await supabase.from("categories").select("slug").eq("slug", slug).single();
  if (!existing) {
    const name = input?.trim() || slug;
    await supabase.from("categories").upsert({ slug, name }, { onConflict: "slug" });
  }
  
  return slug;
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

  const supabase = await getServerSupabaseClient();
  const baseQuery = supabase
    .from("posts")
    .select("*")
    .order("created_at", { ascending: false });

  if (includeDrafts) {
    const auth = await getAuthedAdmin();
    if (!auth.ok) {
      const { data, error } = await baseQuery.eq("published", true);
      if (error) return NextResponse.json({ error: error.message }, { status: 500 });
      return NextResponse.json({ posts: data });
    }

    const { data, error } = await baseQuery;
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ posts: data });
  }

  const { data, error } = await baseQuery.eq("published", true);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ posts: data });
}

export async function POST(request: Request) {
  const auth = await getAuthedAdmin();
  if (!auth.ok) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await request.json()) as SavePostInput;
  console.log("POST /api/posts - body.id:", body.id);
  const slug = body.slug?.trim() || slugify(body.title, { lower: true, strict: true });
  const contentJson = JSON.stringify(
    body.content ?? { type: "doc", content: [{ type: "paragraph" }] },
  );
  const html = renderTiptapHtml(contentJson);
  const excerpt = body.excerpt?.trim() || htmlToExcerpt(html) || "";
  const contentText = html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
  const readingTime = estimateReadingTime(contentText);
  const isPublished = body.published ?? false;

  // If body.id exists, it's an update - use upsert. Otherwise, insert new
  if (body.id) {
    // Update existing post
    const { data, error } = await auth.supabase.from("posts").update({
      title: body.title.trim(),
      slug,
      content: contentJson,
      excerpt,
      cover_url: body.cover_url ?? null,
      category: await normalizeCategory(auth.supabase, body.category),
      tags: body.tags ?? [],
      published: isPublished,
      reading_time: readingTime,
      updated_at: new Date().toISOString(),
    }).eq("id", body.id).select().single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json({ post: data }, { status: 200 });
  }

  // Create new post
  const { data, error } = await auth.supabase.from("posts").insert({
    author_id: auth.user.id,
    title: body.title.trim(),
    slug,
    content: contentJson,
    excerpt,
    cover_url: body.cover_url ?? null,
      category: await normalizeCategory(auth.supabase, body.category),
    tags: body.tags ?? [],
    published: isPublished,
    reading_time: readingTime,
  }).select().single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ post: data }, { status: 201 });
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
