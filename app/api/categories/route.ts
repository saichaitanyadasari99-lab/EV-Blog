import { NextResponse } from "next/server";
import { getServerSupabaseClient } from "@/lib/supabase/server";
import { isAdminEmail } from "@/lib/auth";

export async function GET() {
  const supabase = await getServerSupabaseClient();
  const { data, error } = await supabase
    .from("categories")
    .select("slug, name")
    .order("name");

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ categories: data });
}

export async function POST(request: Request) {
  const supabase = await getServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user?.email || !isAdminEmail(user.email)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await request.json()) as { name: string };
  const slug = (body.name ?? "").toLowerCase().trim().replace(/\s+/g, "-");

  if (!slug) {
    return NextResponse.json({ error: "Name required" }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("categories")
    .upsert({ slug, name: body.name.trim() }, { onConflict: "slug" })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ category: data }, { status: 201 });
}