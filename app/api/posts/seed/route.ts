import { NextResponse } from "next/server";
import { isAdminEmail } from "@/lib/auth";
import { EDITORIAL_SEED_POSTS } from "@/lib/editorial-seed";
import { getServerSupabaseClient } from "@/lib/supabase/server";

export async function POST() {
  const supabase = await getServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user?.email || !isAdminEmail(user.email)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const payload = EDITORIAL_SEED_POSTS.map((post) => ({
    author_id: user.id,
    title: post.title,
    slug: post.slug,
    content: post.content,
    excerpt: post.excerpt,
    cover_url: post.cover_url,
    category: post.category,
    tags: post.tags ?? [],
    published: post.published,
    reading_time: post.reading_time,
    created_at: post.created_at,
    updated_at: post.updated_at,
    references: post.references ?? [],
  }));

  const { data, error } = await supabase
    .from("posts")
    .upsert(payload, { onConflict: "slug" })
    .select("id");

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ inserted: data?.length ?? payload.length });
}
