import { createClient } from "@supabase/supabase-js";
import type { PostRecord } from "@/types/post";

export function getPublicSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );
}

export async function getPublishedPosts() {
  const supabase = getPublicSupabase();
  const { data, error } = await supabase
    .from("posts")
    .select("*")
    .eq("published", true)
    .order("created_at", { ascending: false });

  if (error) {
    throw error;
  }

  return (data ?? []) as PostRecord[];
}

export async function getPublishedPostBySlug(slug: string) {
  const supabase = getPublicSupabase();
  const { data, error } = await supabase
    .from("posts")
    .select("*")
    .eq("slug", slug)
    .eq("published", true)
    .single();

  if (error) {
    return null;
  }

  return data as PostRecord;
}
