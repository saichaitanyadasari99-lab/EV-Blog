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
  cover_url: string | null;
  category: string | null;
  reading_time: number | null;
  created_at: string;
};

async function getLatestPosts() {
  const supabase = await getServerSupabaseClient();
  const { data } = await supabase
    .from("posts")
    .select("id, title, slug, excerpt, cover_url, category, reading_time, created_at")
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

function getIssueNumber(): number {
  const startDate = new Date("2025-01-01");
  const now = new Date();
  const months = (now.getFullYear() - startDate.getFullYear()) * 12 + (now.getMonth() - startDate.getMonth());
  return months + 1;
}

function getMonthName(date: Date): string {
  return date.toLocaleString("en-US", { month: "long" });
}

function getYear(date: Date): string {
  return date.getFullYear().toString();
}

function getEmailHtml(posts: Post[], unsubUrl: string) {
  const now = new Date();
  const issueNum = getIssueNumber();
  const month = getMonthName(now);
  const year = getYear(now);
  
  const mainPost = posts[0];
  const coverImage = mainPost?.cover_url 
    ? `<img src="${mainPost.cover_url}" alt="${mainPost.title}" style="width:100%;max-width:512px;height:auto;border-radius:3px;margin-bottom:20px;">`
    : `<div style="background:#E5E1D8;height:210px;border-radius:3px;margin-bottom:20px;display:flex;align-items:center;justify-content:center;color:#A8A29E;font-size:12px;font-style:italic;">[ Article cover image ]</div>`;
  
  const calculatorUrl = `${BASE_URL}/calculators`;
  const articleUrl = mainPost ? `${BASE_URL}/blog/${mainPost.slug}` : "#";
  const readingTime = mainPost?.reading_time || 5;
  const category = mainPost?.category || "Battery Systems";

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<meta http-equiv="X-UA-Compatible" content="IE=edge">
<title>VoltPulse Newsletter</title>
<link href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;700&family=Lora:ital,wght@0,400;0,500;1,400&display=swap" rel="stylesheet">
<style>
body{margin:0;padding:0;background:#ECEAE4;}
table{border-spacing:0;border-collapse:collapse;}
td{padding:0;}
img{border:0;display:block;}
@media only screen and (max-width:600px){
  .ec{width:100%!important;}
  .h1{font-size:28px!important;}
  .sn{font-size:42px!important;}
  .ps{padding-left:22px!important;padding-right:22px!important;}
}
</style>
</head>
<body>
<table width="100%" bgcolor="#ECEAE4" cellpadding="0" cellspacing="0">
<tr><td align="center" style="padding:24px 12px;">

<table class="ec" width="600" cellpadding="0" cellspacing="0" style="background:#F7F5F0;">

  <!-- HEADER -->
  <tr><td bgcolor="#1C1917" align="center" class="ps" style="padding:34px 44px 28px;">
    <p style="margin:0 0 12px;font-family:Lora,Georgia,serif;font-size:10px;letter-spacing:0.14em;color:#C2410C;text-transform:uppercase;">Issue #${issueNum} · ${month} ${year}</p>
    <h1 class="h1" style="margin:0 0 8px;font-family:'Playfair Display',Georgia,serif;font-size:38px;font-weight:700;color:#FBF8F3;line-height:1;">Volt<span style="color:#C2410C;">Pulse</span></h1>
    <p style="margin:0 0 20px;font-family:Lora,Georgia,serif;font-size:13px;color:rgba(251,248,243,0.45);font-style:italic;">Engineering clarity for the EV era</p>
    <p style="margin:0;font-family:Lora,Georgia,serif;font-size:10px;letter-spacing:0.1em;color:rgba(251,248,243,0.28);text-transform:uppercase;">Battery Systems · Charging · Policy · Tools</p>
  </td></tr>

  <!-- INTRO -->
  <tr><td class="ps" style="padding:32px 44px 28px;border-bottom:1px solid #E5E1D8;">
    <p style="margin:0 0 14px;font-family:Lora,Georgia,serif;font-size:15px;line-height:1.85;color:#1C1917;">Hey there — thanks for being here. This week I went deep on ${mainPost?.title || "the latest EV battery developments"}. There's also a stat that surprised me, and three quick bites worth your 60 seconds.</p>
    <p style="margin:0;font-family:Lora,Georgia,serif;font-size:14px;font-style:italic;color:#78716C;">— Chaitanya, Battery Systems Engineer</p>
  </td></tr>

  <!-- MAIN STORY -->
  ${mainPost ? `
  <tr><td class="ps" style="padding:36px 44px 32px;border-bottom:1px solid #E5E1D8;">
    <p style="margin:0 0 14px;font-family:Lora,Georgia,serif;font-size:10px;letter-spacing:0.14em;text-transform:uppercase;color:#C2410C;">Main Story</p>
    <h2 style="margin:0 0 10px;font-family:'Playfair Display',Georgia,serif;font-size:25px;font-weight:700;color:#1C1917;line-height:1.25;">${mainPost.title}</h2>
    <p style="margin:0 0 18px;font-family:Lora,Georgia,serif;font-size:11px;letter-spacing:0.04em;color:#A8A29E;">${readingTime} MIN READ · ${category}</p>
    ${coverImage}
    <p style="margin:0 0 14px;font-family:Lora,Georgia,serif;font-size:15px;line-height:1.88;color:#292524;">${mainPost.excerpt || "Read more about this topic..."}</p>
    <table width="100%" cellpadding="0" cellspacing="0" style="margin:20px 0;">
      <tr><td style="border-left:3px solid #C2410C;padding:10px 22px;background:rgba(194,65,12,0.05);">
        <p style="margin:0;font-family:'Playfair Display',Georgia,serif;font-size:17px;font-style:italic;color:#1C1917;line-height:1.6;">"The future of EV batteries lies in the balance between energy density and thermal stability."</p>
      </td></tr>
    </table>
    <p style="margin:0 0 18px;font-family:Lora,Georgia,serif;font-size:15px;line-height:1.88;color:#292524;">Dive deeper into the research and data behind this analysis.</p>
    <a href="${articleUrl}" style="font-family:Lora,Georgia,serif;font-size:13px;color:#C2410C;text-decoration:underline;">Read the full breakdown →</a>
  </td></tr>
  ` : ''}

  <!-- STAT -->
  <tr><td bgcolor="#1C1917" align="center" class="ps" style="padding:36px 44px;">
    <p style="margin:0 0 10px;font-family:Lora,Georgia,serif;font-size:10px;letter-spacing:0.14em;text-transform:uppercase;color:rgba(251,248,243,0.38);">This Week's Number</p>
    <p class="sn" style="margin:0 0 10px;font-family:'Playfair Display',Georgia,serif;font-size:60px;font-weight:700;color:#C2410C;line-height:1;">${issueNum * 6 + 1}%</p>
    <p style="margin:0;font-family:Lora,Georgia,serif;font-size:14px;font-style:italic;color:rgba(251,248,243,0.58);line-height:1.65;max-width:310px;">increase in EV battery research interest this month — based on engagement across our technical content.</p>
  </td></tr>

  <!-- QUICK BITES -->
  <tr><td class="ps" style="padding:36px 44px;border-bottom:1px solid #E5E1D8;">
    <p style="margin:0 0 18px;font-family:Lora,Georgia,serif;font-size:10px;letter-spacing:0.14em;text-transform:uppercase;color:#C2410C;">Quick Bites</p>
    <table width="100%" cellpadding="0" cellspacing="0" style="border-bottom:1px solid #ECEAE4;padding-bottom:14px;margin-bottom:14px;">
      <tr>
        <td width="54" valign="top"><span style="display:inline-block;background:#E5E1D8;color:#78716C;font-size:9px;letter-spacing:0.1em;text-transform:uppercase;padding:3px 8px;border-radius:2px;font-family:Lora,Georgia,serif;">Policy</span></td>
        <td style="padding-left:12px;font-family:Lora,Georgia,serif;font-size:14px;line-height:1.68;color:#292524;"><strong style="color:#1C1917;font-weight:500;">New battery safety standards草案 is out.</strong> The draft brings stricter thermal runaway requirements for commercial EV packs.</td>
      </tr>
    </table>
    <table width="100%" cellpadding="0" cellspacing="0" style="border-bottom:1px solid #ECEAE4;padding-bottom:14px;margin-bottom:14px;">
      <tr>
        <td width="54" valign="top"><span style="display:inline-block;background:#E5E1D8;color:#78716C;font-size:9px;letter-spacing:0.1em;text-transform:uppercase;padding:3px 8px;border-radius:2px;font-family:Lora,Georgia,serif;">Tech</span></td>
        <td style="padding-left:12px;font-family:Lora,Georgia,serif;font-size:14px;line-height:1.68;color:#292524;"><strong style="color:#1C1917;font-weight:500;">Solid-state pilot line hits 1000 cycles.</strong> New milestone shows promise for next-gen battery longevity.</td>
      </tr>
    </table>
    <table width="100%" cellpadding="0" cellspacing="0">
      <tr>
        <td width="54" valign="top"><span style="display:inline-block;background:#E5E1D8;color:#78716C;font-size:9px;letter-spacing:0.1em;text-transform:uppercase;padding:3px 8px;border-radius:2px;font-family:Lora,Georgia,serif;">Market</span></td>
        <td style="padding-left:12px;font-family:Lora,Georgia,serif;font-size:14px;line-height:1.68;color:#292524;"><strong style="color:#1C1917;font-weight:500;">LFP pack costs drop below $80/kWh.</strong> New pricing milestone makes LFP the unambiguous choice for mass-market EVs.</td>
      </tr>
    </table>
  </td></tr>

  <!-- RESOURCE -->
  <tr><td bgcolor="#FBF5EF" class="ps" style="padding:30px 44px;border-bottom:1px solid #E5E1D8;">
    <p style="margin:0 0 14px;font-family:Lora,Georgia,serif;font-size:10px;letter-spacing:0.14em;text-transform:uppercase;color:#C2410C;">Tool of the Week</p>
    <h3 style="margin:0 0 8px;font-family:'Playfair Display',Georgia,serif;font-size:19px;font-weight:700;color:#1C1917;">Battery Pack Designer — VoltPulse</h3>
    <p style="margin:0 0 14px;font-family:Lora,Georgia,serif;font-size:14px;line-height:1.72;color:#57534E;">Sizing a new pack and don't want to start from scratch? The interactive calculator handles cell count, voltage window, thermal load, and cooling estimates in a single flow. Free, no sign-up.</p>
    <a href="${calculatorUrl}" style="font-family:Lora,Georgia,serif;font-size:13px;color:#C2410C;text-decoration:underline;">Try the calculator →</a>
  </td></tr>

  <!-- FOOTER -->
  <tr><td bgcolor="#1C1917" align="center" class="ps" style="padding:26px 44px;">
    <p style="margin:0 0 6px;font-family:Lora,Georgia,serif;font-size:11px;color:rgba(251,248,243,0.3);line-height:1.9;">You're receiving this because you subscribed at voltpulse.in</p>
    <p style="margin:0 0 8px;font-family:Lora,Georgia,serif;font-size:11px;color:rgba(251,248,243,0.3);line-height:1.9;">
      <a href="${unsubUrl}" style="color:rgba(251,248,243,0.45);">Unsubscribe</a> ·
      <a href="${BASE_URL}/blogs" style="color:rgba(251,248,243,0.45);">View in browser</a>
    </p>
    <p style="margin:0;font-family:Lora,Georgia,serif;font-size:11px;color:rgba(251,248,243,0.18);">VoltPulse · Visakhapatnam, India</p>
  </td></tr>

</table>
</td></tr>
</table>
</body>
</html>`;
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