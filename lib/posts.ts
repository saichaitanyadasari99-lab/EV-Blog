import { getServerSupabaseClient } from "@/lib/supabase/server";
import type { PostRecord } from "@/types/post";

const categoryAliases: Record<string, string> = {
  post: "cell-chemistry",
  "cell-chemistry": "cell-chemistry",
  "deep-dive": "bms-design",
  "bms-design": "bms-design",
  benchmark: "ev-benchmarks",
  "ev-benchmarks": "ev-benchmarks",
  review: "vehicle-reviews",
  "vehicle-reviews": "vehicle-reviews",
  standards: "standards",
  news: "news",
};

function canonicalCategory(category?: string | null) {
  const key = (category ?? "post").trim().toLowerCase();
  return categoryAliases[key] ?? key;
}

export async function getPublishedPosts() {
  const supabase = await getServerSupabaseClient();
  const { data, error } = await supabase
    .from("posts")
    .select("*")
    .eq("published", true)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("getPublishedPosts error:", error);
    return [] as PostRecord[];
  }

  return (data ?? []) as PostRecord[];
}

export async function getPublishedPostBySlug(slug: string) {
  const supabase = await getServerSupabaseClient();
  const { data, error } = await supabase
    .from("posts")
    .select("*")
    .eq("slug", slug.trim().toLowerCase())
    .eq("published", true)
    .single();

  if (error) {
    console.error("getPublishedPostBySlug error:", error.message, "slug:", slug);
    return null;
  }

  return data as PostRecord;
}

export async function getPublishedPostsByCategory(category: string) {
  const posts = await getPublishedPosts();
  const requested = canonicalCategory(category);
  return posts.filter((post) => canonicalCategory(post.category) === requested);
}

export async function searchPublishedPosts(query: string) {
  const keyword = query.trim().toLowerCase();
  if (!keyword) return [] as PostRecord[];

  const posts = await getPublishedPosts();
  return posts.filter((post) => {
    const hay = [
      post.title,
      post.excerpt ?? "",
      post.content ?? "",
      post.category ?? "",
      (post.tags ?? []).join(" "),
    ]
      .join(" ")
      .toLowerCase();
    return hay.includes(keyword);
  });
}
