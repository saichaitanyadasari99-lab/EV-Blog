import { getServerSupabaseClient } from "@/lib/supabase/server";
import type { PostRecord } from "@/types/post";

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
  return posts.filter(
    (post) => (post.category ?? "post").toLowerCase() === category.toLowerCase(),
  );
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
