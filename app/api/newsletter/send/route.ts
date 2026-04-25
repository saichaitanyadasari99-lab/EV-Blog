import { NextRequest, NextResponse } from "next/server";
import { getServerSupabaseClient } from "@/lib/supabase/server";
import { requireAdminUser } from "@/lib/auth";

const BATCH_SIZE = 100;
const ADMIN_EMAIL = "saichaitanyadasari99@gmail.com";
const FROM_NAME = "VoltPulse";
const BASE_URL = "https://ev-blog-post.vercel.app";

type Subscriber = {
  id: string;
  email: string;
  full_name: string | null;
};

type Post = {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
};

async function getLatestPosts() {
  const supabase = await getServerSupabaseClient();
  const { data } = await supabase
    .from("posts")
    .select("id, title, slug, excerpt")
    .eq("published", true)
    .order("updated_at", { ascending: false })
    .limit(3);
  return (data ?? []) as Post[];
}

async function getSubscribers() {
  const supabase = await getServerSupabaseClient();
  const { data } = await supabase
    .from("newsletter_subscribers")
    .select("id, email, full_name")
    .eq("opted_in", true);
  return (data ?? []) as Subscriber[];
}

async function getQueuePosition() {
  const supabase = await getServerSupabaseClient();
  const { data } = await supabase
    .from("newsletter_queue")
    .select("position")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  return data?.position ?? 0;
}

async function updateQueue(pos: number) {
  const supabase = await getServerSupabaseClient();
  const { data } = await supabase.from("newsletter_queue").select("id").order("created_at").limit(1).maybeSingle();
  if (data?.id) {
    await supabase.from("newsletter_queue").update({ position: pos }).eq("id", data.id);
  }
}

function getEmailHtml(posts: Post[], unsubUrl: string) {
  const postsHtml = posts.map(p => `
    <div style="margin-bottom:20px;padding-bottom:15px;border-bottom:1px solid #eee;">
      <h3 style="margin:0 0 8px;"><a href="${BASE_URL}/blog/${p.slug}" style="color:#22c55e;text-decoration:none;">${p.title}</a></h3>
      <p style="margin:0;color:#666;font-size:14px;">${p.excerpt || 'Read more...'}</p>
    </div>
  `).join('');

  return `<!DOCTYPE html>
<html><body style="margin:0;padding:20px;font-family:Arial,sans-serif;background:#f5f5f5;">
  <div style="max-width:600px;margin:0 auto;background:white;padding:25px;border-radius:10px;">
    <h1 style="color:#22c55e;margin:0 0 15px;">⚡ VoltPulse Weekly</h1>
    <p>Your EV Battery Design Updates</p>
    ${postsHtml}
    <p style="font-size:12px;color:#999;margin-top:20px;">
      Subscribed to VoltPulse. <a href="${unsubUrl}" style="color:#999;">Unsubscribe</a>
    </p>
  </div>
</body></html>`;
}

async function sendEmailResend(toEmail: string, subject: string, html: string) {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) throw new Error("RESEND_API_KEY not configured");

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: "VoltPulse <onboarding@resend.dev>",
      to: toEmail,
      subject: subject,
      html: html,
    }),
  });

  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.message || "Failed to send");
  }
  return res.json();
}

export async function POST(request: NextRequest) {
  try { await requireAdminUser(); }
  catch { return NextResponse.json({ error: "Unauthorized" }, { status: 401 }); }

  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) return NextResponse.json({ error: "RESEND_API_KEY not configured" }, { status: 500 });

  try {
    const posts = await getLatestPosts();
    if (!posts.length) return NextResponse.json({ error: "No posts" }, { status: 400 });

    const url = new URL(request.url);
    const isPreview = url.searchParams.get("preview") === "true";

    if (isPreview) {
      const html = getEmailHtml(posts, `${BASE_URL}/api/newsletter/unsubscribe`);
      await sendEmailResend(ADMIN_EMAIL, `⚡ PREVIEW: ${posts[0].title}`, html);
      return NextResponse.json({ success: true, sent: 1, preview: true });
    }

    const subs = await getSubscribers();
    if (!subs.length) return NextResponse.json({ error: "No subscribers" }, { status: 400 });

    let pos = await getQueuePosition();
    if (pos >= subs.length) { pos = 0; await updateQueue(0); }

    const batch = subs.slice(pos, Math.min(pos + BATCH_SIZE, subs.length));
    const html = getEmailHtml(posts, `${BASE_URL}/api/newsletter/unsubscribe`);

    let sent = 0, failed = 0;
    for (const s of batch) {
      try { await sendEmailResend(s.email, `⚡ ${posts[0].title}`, html); sent++; }
      catch { failed++; }
    }

    await updateQueue(pos + batch.length);
    return NextResponse.json({
      success: true, sent, failed,
      batch: { start: pos + 1, end: pos + batch.length, total: subs.length }
    });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}

export async function GET() {
  const supabase = await getServerSupabaseClient();
  try {
    const [{ data: s }, { data: p }, pos] = await Promise.all([
      supabase.from("newsletter_subscribers").select("id").eq("opted_in", true),
      supabase.from("posts").select("id").eq("published", true),
      getQueuePosition(),
    ]);
    return NextResponse.json({ totalSubscribers: (s ?? []).length, pendingPosts: (p ?? []).length, position: pos });
  } catch { return NextResponse.json({ totalSubscribers: 0 }); }
}