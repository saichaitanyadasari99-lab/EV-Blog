import { NextResponse } from "next/server";
import { getServerSupabaseClient } from "@/lib/supabase/server";
import { isAdminEmail } from "@/lib/auth";
import { EDITORIAL_SEED_POSTS } from "@/lib/editorial-seed";

type RefItem = { title: string; url: string };

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

function withReferences(content: string | null, references?: RefItem[] | null) {
  const body = content ?? "";
  if (!references?.length) return body;

  const refs = references.map((ref) => `- ${ref.title}: ${ref.url}`).join("\n");
  return `${body}\n\n## References\n${refs}`;
}

function fallbackCategory() {
  return "post";
}

export async function POST() {
  const auth = await getAuthedAdmin();
  if (!auth.ok) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const authorName =
    (auth.user.user_metadata?.full_name as string | undefined) ||
    (auth.user.user_metadata?.name as string | undefined) ||
    auth.user.email?.split("@")[0] ||
    "admin";

  const { error: profileError } = await auth.supabase.from("profiles").upsert(
    {
      id: auth.user.id,
      display_name: authorName,
      role: "admin",
    },
    { onConflict: "id" },
  );

  if (profileError && !profileError.message.toLowerCase().includes("relation")) {
    return NextResponse.json(
      { error: `Profile bootstrap failed: ${profileError.message}` },
      { status: 500 },
    );
  }

  const rows = EDITORIAL_SEED_POSTS.map((post) => ({
    author_id: auth.user.id,
    author_name: authorName,
    title: post.title,
    slug: post.slug,
    content: withReferences(
      post.content,
      (post.references as RefItem[] | null | undefined) ?? null,
    ),
    excerpt: post.excerpt ?? "",
    cover_url: post.cover_url ?? null,
    category: post.category ?? "post",
    status: "published",
    published_at: post.created_at,
    tags: [
      ...(post.tags ?? []),
      ...(post.category === "review" ? ["section-review"] : []),
      ...(post.category === "standards" ? ["section-standards"] : []),
    ],
    published: true,
    reading_time: post.reading_time ?? 8,
  }));

  const inserted: Array<{ id: string; slug: string }> = [];
  for (const row of rows) {
    const firstTry = await auth.supabase
      .from("posts")
      .upsert(row, { onConflict: "slug" })
      .select("id, slug")
      .single();

    if (!firstTry.error) {
      inserted.push(firstTry.data);
      continue;
    }

    if (!firstTry.error.message.includes("posts_category_check")) {
      return NextResponse.json({ error: firstTry.error.message }, { status: 500 });
    }

    const retry = await auth.supabase
      .from("posts")
      .upsert(
        {
          ...row,
          category: fallbackCategory(),
          tags: [...(row.tags ?? []), `mapped-category:${row.category as string}`],
        },
        { onConflict: "slug" },
      )
      .select("id, slug")
      .single();

    if (retry.error) {
      return NextResponse.json({ error: retry.error.message }, { status: 500 });
    }

    inserted.push(retry.data);
  }

  return NextResponse.json({ inserted: inserted.length });
}
