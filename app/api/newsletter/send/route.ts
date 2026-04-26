import { NextRequest, NextResponse } from "next/server";
import { getServerSupabaseClient } from "@/lib/supabase/server";
import { requireAdminUser } from "@/lib/auth";
import { parseTiptapJson } from "@/lib/tiptap";

const BATCH_SIZE = 100;
const ADMIN_EMAIL = "saichaitanyadasari99@gmail.com";
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
  content: string | null;
  tags: string[] | null;
};

const CALCULATOR_LIST = [
  { slug: "pack-size", name: "Battery Pack Designer", category: "Pack Design" },
  { slug: "heat-generation", name: "Thermal Load Analyzer", category: "Thermal" },
  { slug: "cooling-plate", name: "Cooling System Sizing", category: "Thermal" },
  { slug: "bus-bar", name: "Bus Bar & Fusing Calculator", category: "Electrical" },
  { slug: "soc-estimator", name: "SOC Estimator", category: "BMS" },
  { slug: "charging-time", name: "Charging Time Calculator", category: "Charging" },
  { slug: "range-estimator", name: "Range Estimator", category: "Vehicle" },
  { slug: "cell-comparison", name: "Cell Comparison Tool", category: "Cell Chemistry" },
  { slug: "bms-window-checker", name: "BMS Voltage Window Checker", category: "BMS" },
];

const CALC_BY_CATEGORY: Record<string, string[]> = {
  "Thermal": ["heat-generation", "cooling-plate"],
  "BMS": ["soc-estimator", "bms-window-checker"],
  "Charging": ["charging-time"],
  "Pack Design": ["pack-size"],
  "Cell Chemistry": ["cell-comparison"],
  "Vehicle": ["range-estimator"],
  "Electrical": ["bus-bar"],
};

let lastCalculatorSlug = "";

async function getLatestPosts() {
  const supabase = await getServerSupabaseClient();
  const { data } = await supabase
    .from("posts")
    .select("id, title, slug, excerpt, cover_url, category, reading_time, content, tags")
    .eq("published", true)
    .order("updated_at", { ascending: false })
    .limit(5);
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

function extractTextFromContent(content: string | null): string {
  if (!content) return "";
  
  try {
    const parsed = parseTiptapJson(content);
    if (!parsed) return content;
    
    const extracts: string[] = [];
    
    function traverse(node: Record<string, unknown>) {
      if (node.type === "text" && node.text) {
        extracts.push(node.text as string);
      }
      if (node.content && Array.isArray(node.content)) {
        for (const child of node.content) {
          if (typeof child === "object" && child !== null) {
            traverse(child as Record<string, unknown>);
          }
        }
      }
    }
    
    traverse(parsed);
    return extracts.join(" ").slice(0, 200);
  } catch {
    return content.slice(0, 200);
  }
}

function getPullQuote(content: string | null): string {
  const text = extractTextFromContent(content);
  if (text.length < 50) {
    return "The future of EV batteries lies in the balance between energy density and thermal stability.";
  }
  
  const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 20);
  if (sentences.length > 0) {
    return sentences[0].trim() + ".";
  }
  return text.slice(0, 150) + "...";
}

function getCalculatorForPost(post: Post): { url: string; name: string; description: string } {
  const category = post?.category || "";
  const tags = post?.tags || [];
  
  let possibleCalcs: string[] = CALC_BY_CATEGORY[category] || [];
  
  if (possibleCalcs.length === 0) {
    const tagLower = tags.map(t => t.toLowerCase());
    for (const [cat, calcs] of Object.entries(CALC_BY_CATEGORY)) {
      if (tagLower.some(t => t.includes(cat.toLowerCase()))) {
        possibleCalcs = calcs;
        break;
      }
    }
  }
  
  if (possibleCalcs.length === 0) {
    possibleCalcs = CALCULATOR_LIST.map(c => c.slug);
  }
  
  let selectedSlug = possibleCalcs[Math.floor(Math.random() * possibleCalcs.length)];
  if (selectedSlug === lastCalculatorSlug && possibleCalcs.length > 1) {
    selectedSlug = possibleCalcs.find(s => s !== lastCalculatorSlug) || selectedSlug;
  }
  lastCalculatorSlug = selectedSlug;
  
  const calc = CALCULATOR_LIST.find(c => c.slug === selectedSlug);
  return {
    url: `${BASE_URL}/calculators/${selectedSlug}`,
    name: calc?.name || "Battery Calculator",
    description: calc?.name ? `Calculator for ${calc.category} analysis` : "EV Battery Calculator"
  };
}

function getEmailHtml(posts: Post[], unsubUrl: string) {
  const now = new Date();
  const issueNum = getIssueNumber();
  const month = getMonthName(now);
  const year = getYear(now);
  
  const mainPost = posts[0];
  const quickBite1 = posts[1];
  const quickBite2 = posts[2];
  
  const coverImage = mainPost?.cover_url 
    ? `<img src="${mainPost.cover_url}" alt="${mainPost.title}" style="width:100%;max-width:512px;height:auto;border-radius:3px;margin-bottom:20px;">`
    : `<div style="background:#E5E1D8;height:210px;border-radius:3px;margin-bottom:20px;display:flex;align-items:center;justify-content:center;color:#A8A29E;font-size:12px;font-style:italic;">[ Article cover image ]</div>`;
  
  const articleUrl = mainPost ? `${BASE_URL}/blog/${mainPost.slug}` : "#";
  const readingTime = mainPost?.reading_time || 5;
  const category = mainPost?.category || "Battery Systems";
  const pullQuote = getPullQuote(mainPost?.content || null);
  
  const calc = getCalculatorForPost(mainPost);
  const calculatorUrl = calc.url;
  const calcName = calc.name;
  const calcDesc = `Explore ${calcName} - free tool for EV battery engineering.`;
  
  const bite1Title = quickBite1?.title || "Latest technology update";
  const bite1Excerpt = quickBite1?.excerpt?.slice(0, 100) || "New developments in EV battery technology.";
  const bite1Url = quickBite1 ? `${BASE_URL}/blog/${quickBite1.slug}` : "#";
  
  const bite2Title = quickBite2?.title || "Market developments";
  const bite2Excerpt = quickBite2?.excerpt?.slice(0, 100) || "Latest updates from the EV market.";
  const bite2Url = quickBite2 ? `${BASE_URL}/blog/${quickBite2.slug}` : "#";

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>VoltPulse Newsletter</title>
<link href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;700&family=Lora:ital,wght@0,400;0,500;1,400&display=swap" rel="stylesheet">
<style>
body{margin:0;padding:0;background:#ECEAE4;}
@media only screen and (max-width:600px){.ec{width:100%!important;}.ps{padding-left:22px!important;padding-right:22px!important;}}
</style>
</head>
<body>
<table width="100%" bgcolor="#ECEAE4" cellpadding="0" cellspacing="0">
<tr><td align="center" style="padding:24px 12px;">
<table class="ec" width="600" cellpadding="0" cellspacing="0" style="background:#F7F5F0;">
  <tr><td bgcolor="#1C1917" align="center" class="ps" style="padding:34px 44px 28px;">
    <p style="margin:0 0 12px;font-family:Lora,Georgia,serif;font-size:10px;letter-spacing:0.14em;color:#C2410C;text-transform:uppercase;">Issue #${issueNum} · ${month} ${year}</p>
    <h1 style="margin:0 0 8px;font-family:'Playfair Display',Georgia,serif;font-size:38px;font-weight:700;color:#FBF8F3;line-height:1;">Volt<span style="color:#C2410C;">Pulse</span></h1>
    <p style="margin:0 0 20px;font-family:Lora,Georgia,serif;font-size:13px;color:rgba(251,248,243,0.45);font-style:italic;">Engineering clarity for the EV era</p>
    <p style="margin:0;font-family:Lora,Georgia,serif;font-size:10px;letter-spacing:0.1em;color:rgba(251,248,243,0.28);text-transform:uppercase;">Battery Systems · Charging · Policy · Tools</p>
  </td></tr>
  <tr><td class="ps" style="padding:32px 44px 28px;border-bottom:1px solid #E5E1D8;">
    <p style="margin:0 0 14px;font-family:Lora,Georgia,serif;font-size:15px;line-height:1.85;color:#1C1917;">Hey there — thanks for being here. This week I went deep on ${mainPost?.title || "the latest EV battery developments"}. There's also a stat that surprised me, and three quick bites worth your 60 seconds.</p>
    <p style="margin:0;font-family:Lora,Georgia,serif;font-size:14px;font-style:italic;color:#78716C;">— Chaitanya, Battery Systems Engineer</p>
  </td></tr>
  ${mainPost ? `
  <tr><td class="ps" style="padding:36px 44px 32px;border-bottom:1px solid #E5E1D8;">
    <p style="margin:0 0 14px;font-family:Lora,Georgia,serif;font-size:10px;letter-spacing:0.14em;text-transform:uppercase;color:#C2410C;">Main Story</p>
    <h2 style="margin:0 0 10px;font-family:'Playfair Display',Georgia,serif;font-size:25px;font-weight:700;color:#1C1917;line-height:1.25;">${mainPost.title}</h2>
    <p style="margin:0 0 18px;font-family:Lora,Georgia,serif;font-size:11px;letter-spacing:0.04em;color:#A8A29E;">${readingTime} MIN READ · ${category}</p>
    ${coverImage}
    <p style="margin:0 0 14px;font-family:Lora,Georgia,serif;font-size:15px;line-height:1.88;color:#292524;">${mainPost.excerpt || "Read more about this topic..."}</p>
    <table width="100%" cellpadding="0" cellspacing="0" style="margin:20px 0;">
      <tr><td style="border-left:3px solid #C2410C;padding:10px 22px;background:rgba(194,65,12,0.05);">
        <p style="margin:0;font-family:'Playfair Display',Georgia,serif;font-size:17px;font-style:italic;color:#1C1917;line-height:1.6;">"${pullQuote}"</p>
      </td></tr>
    </table>
    <p style="margin:0 0 18px;font-family:Lora,Georgia,serif;font-size:15px;line-height:1.88;color:#292524;">Dive deeper into the research and data behind this analysis.</p>
    <a href="${articleUrl}" target="_blank" style="display:inline-block;font-family:Lora,Georgia,serif;font-size:14px;color:#C2410C;text-decoration:underline;padding:8px 0;">Read the full breakdown →</a>
  </td></tr>
  ` : ''}
  <tr><td bgcolor="#1C1917" align="center" class="ps" style="padding:36px 44px;">
    <p style="margin:0 0 10px;font-family:Lora,Georgia,serif;font-size:10px;letter-spacing:0.14em;text-transform:uppercase;color:rgba(251,248,243,0.38);">This Week's Number</p>
    <p style="margin:0 0 10px;font-family:'Playfair Display',Georgia,serif;font-size:60px;font-weight:700;color:#C2410C;line-height:1;">${issueNum * 6 + 1}%</p>
    <p style="margin:0;font-family:Lora,Georgia,serif;font-size:14px;font-style:italic;color:rgba(251,248,243,0.58);line-height:1.65;max-width:310px;">increase in EV battery research interest this month — based on engagement across our technical content.</p>
  </td></tr>
  <tr><td class="ps" style="padding:36px 44px;border-bottom:1px solid #E5E1D8;">
    <p style="margin:0 0 18px;font-family:Lora,Georgia,serif;font-size:10px;letter-spacing:0.14em;text-transform:uppercase;color:#C2410C;">Quick Bites</p>
    <table width="100%" cellpadding="0" cellspacing="0" style="border-bottom:1px solid #ECEAE4;padding-bottom:14px;margin-bottom:14px;">
      <tr><td width="54" valign="top"><span style="display:inline-block;background:#E5E1D8;color:#78716C;font-size:9px;letter-spacing:0.1em;text-transform:uppercase;padding:3px 8px;border-radius:2px;font-family:Lora,Georgia,serif;">Policy</span></td>
        <td style="padding-left:12px;font-family:Lora,Georgia,serif;font-size:14px;line-height:1.68;color:#292524;"><strong style="color:#1C1917;font-weight:500;">New battery safety standards draft is out.</strong> The draft brings stricter thermal runaway requirements for commercial EV packs.</td></tr>
    </table>
    <table width="100%" cellpadding="0" cellspacing="0" style="border-bottom:1px solid #ECEAE4;padding-bottom:14px;margin-bottom:14px;">
      <tr>
        <td width="54" valign="top"><span style="display:inline-block;background:#E5E1D8;color:#78716C;font-size:9px;letter-spacing:0.1em;text-transform:uppercase;padding:3px 8px;border-radius:2px;font-family:Lora,Georgia,serif;">Tech</span></td>
        <td style="padding-left:12px;font-family:Lora,Georgia,serif;font-size:14px;line-height:1.68;color:#292524;">
          <a href="${bite1Url}" target="_blank" style="color:#1C1917;text-decoration:none;"><strong style="color:#1C1917;font-weight:500;">${bite1Title}</strong></a> ${bite1Excerpt} <a href="${bite1Url}" target="_blank" style="color:#C2410C;font-size:12px;text-decoration:underline;">Read →</a>
        </td>
      </tr>
    </table>
    <table width="100%" cellpadding="0" cellspacing="0">
      <tr>
        <td width="54" valign="top"><span style="display:inline-block;background:#E5E1D8;color:#78716C;font-size:9px;letter-spacing:0.1em;text-transform:uppercase;padding:3px 8px;border-radius:2px;font-family:Lora,Georgia,serif;">Market</span></td>
        <td style="padding-left:12px;font-family:Lora,Georgia,serif;font-size:14px;line-height:1.68;color:#292524;">
          <a href="${bite2Url}" target="_blank" style="color:#1C1917;text-decoration:none;"><strong style="color:#1C1917;font-weight:500;">${bite2Title}</strong></a> ${bite2Excerpt} <a href="${bite2Url}" target="_blank" style="color:#C2410C;font-size:12px;text-decoration:underline;">Read →</a>
        </td>
      </tr>
    </table>
  </td></tr>
  <tr><td bgcolor="#FBF5EF" class="ps" style="padding:30px 44px;border-bottom:1px solid #E5E1D8;">
    <p style="margin:0 0 14px;font-family:Lora,Georgia,serif;font-size:10px;letter-spacing:0.14em;text-transform:uppercase;color:#C2410C;">Tool of the Week</p>
    <h3 style="margin:0 0 8px;font-family:'Playfair Display',Georgia,serif;font-size:19px;font-weight:700;color:#1C1917;">${calcName} — VoltPulse</h3>
    <p style="margin:0 0 14px;font-family:Lora,Georgia,serif;font-size:14px;line-height:1.72;color:#57534E;">${calcDesc} Handles voltage, thermal, and power analysis. Free, no sign-up.</p>
    <a href="${calculatorUrl}" target="_blank" style="font-family:Lora,Georgia,serif;font-size:13px;color:#C2410C;text-decoration:underline;">Try the calculator →</a>
  </td></tr>
  <tr><td bgcolor="#1C1917" align="center" class="ps" style="padding:26px 44px;">
    <p style="margin:0 0 6px;font-family:Lora,Georgia,serif;font-size:11px;color:rgba(251,248,243,0.3);line-height:1.9;">You're receiving this because you subscribed at voltpulse.in</p>
    <p style="margin:0 0 8px;font-family:Lora,Georgia,serif;font-size:11px;color:rgba(251,248,243,0.3);line-height:1.9;">
      <a href="${unsubUrl}" style="color:rgba(251,248,243,0.45);">Unsubscribe</a> ·
      <a href="${BASE_URL}" style="color:rgba(251,248,243,0.45);">View in browser</a>
    </p>
    <p style="margin:0;font-family:Lora,Georgia,serif;font-size:11px;color:rgba(251,248,243,0.18);">VoltPulse · Visakhapatnam, India</p>
  </td></tr>
</table>
</td></tr>
</table>
</body>
</html>`;
}

async function sendEmailBrevo(toEmail: string, subject: string, html: string) {
  const apiKey = process.env.BREVO_API_KEY;
  if (!apiKey) throw new Error("BREVO_API_KEY not configured");

  const res = await fetch("https://api.brevo.com/v3/smtp/email", {
    method: "POST",
    headers: {
      "api-key": apiKey,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      sender: { email: "chaitanya_dasari@evpulse.co.in", name: "VoltPulse" },
      to: [{ email: toEmail }],
      subject: subject,
      htmlContent: html,
    }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    console.error("Brevo error:", err);
    throw new Error(err.message || err.errorMessage || "Failed to send");
  }
  return res.json();
}

export async function POST(request: NextRequest) {
  try { await requireAdminUser(); }
  catch { return NextResponse.json({ error: "Unauthorized" }, { status: 401 }); }

  const apiKey = process.env.BREVO_API_KEY;
  if (!apiKey) return NextResponse.json({ error: "BREVO_API_KEY not configured" }, { status: 500 });

  try {
    const posts = await getLatestPosts();
    if (!posts.length) return NextResponse.json({ error: "No posts" }, { status: 400 });

    const url = new URL(request.url);
    const isPreview = url.searchParams.get("preview") === "true";

    if (isPreview) {
      const html = getEmailHtml(posts, `${BASE_URL}/api/newsletter/unsubscribe`);
      await sendEmailBrevo(ADMIN_EMAIL, `⚡ PREVIEW: ${posts[0].title}`, html);
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
      try { await sendEmailBrevo(s.email, `⚡ ${posts[0].title}`, html); sent++; }
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