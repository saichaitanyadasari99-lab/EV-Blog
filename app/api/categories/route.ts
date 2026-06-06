import { NextResponse } from "next/server";
import { getServerSupabaseClient } from "@/lib/supabase/server";
import { isAdminEmail } from "@/lib/auth";

async function requireAdmin(supabase: Awaited<ReturnType<typeof getServerSupabaseClient>>) {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user?.email || !isAdminEmail(user.email)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}

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
  const unauthorized = await requireAdmin(supabase);
  if (unauthorized) return unauthorized;

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

export async function DELETE(request: Request) {
  const supabase = await getServerSupabaseClient();
  const unauthorized = await requireAdmin(supabase);
  if (unauthorized) return unauthorized;

  const { searchParams } = new URL(request.url);
  const slug = searchParams.get("slug");

  if (!slug) {
    return NextResponse.json({ error: "Missing slug" }, { status: 400 });
  }

  const { error } = await supabase.from("categories").delete().eq("slug", slug);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ success: true });
}