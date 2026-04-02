import { notFound } from "next/navigation";
import { Editor } from "@/components/Editor";
import { requireAdminUser } from "@/lib/auth";
import { getServerSupabaseClient } from "@/lib/supabase/server";
import type { PostRecord } from "@/types/post";

type Params = {
  params: Promise<{ id: string }>;
};

export default async function EditPostPage({ params }: Params) {
  await requireAdminUser();
  const { id } = await params;
  const supabase = await getServerSupabaseClient();
  const { data, error } = await supabase.from("posts").select("*").eq("id", id).single();

  if (error || !data) {
    notFound();
  }

  return <Editor initialPost={data as PostRecord} />;
}
