import { NextRequest, NextResponse } from "next/server";
import { getServerSupabaseClient } from "@/lib/supabase/server";
import { requireAdminUser } from "@/lib/auth";
import { parseTiptapJson } from "@/lib/tiptap";

const BATCH_SIZE = 100;
const ADMIN_EMAIL = "saichaitanyadasari99@gmail.com";
const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || "https://www.evpulse.co.in";

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
  pullquote: string | null;
  stats: Array<{ value: string; label: string }> | null;
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
    .select("id, title, slug, excerpt, cover_url, category, reading_time, content, tags, pullquote, stats")
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

function getPullQuote(post: Post | null): string {
  if (post?.pullquote) {
    return post.pullquote;
  }
  
  const text = extractTextFromContent(post?.content || null);
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

function getStatsForPost(post: Post | null): { value: string; label: string }[] {
  if (post?.stats && post.stats.length > 0) {
    return post.stats.slice(0, 3);
  }
  return [];
}

function extractSectionsFromPost(post: Post | null): { heading: string; body: string }[] {
  const sections: { heading: string; body: string }[] = [];
  
  if (!post?.content) {
    return sections;
  }
  
  try {
    const parsed = JSON.parse(post.content);
    const extracts: string[] = [];
    let currentHeading = '';
    let currentBody: string[] = [];
    
    function traverse(node: Record<string, unknown>) {
      if (node.type === 'heading' && node.attrs?.level === 2) {
        if (currentHeading && currentBody.length > 0) {
          sections.push({
            heading: currentHeading,
            body: currentBody.join(' ').slice(0, 200)
          });
        }
        currentHeading = (node.content || []).map((c: Record<string, unknown>) => c.text || '').join('');
        currentBody = [];
      } else if (node.type === 'paragraph' && node.content) {
        const text = (node.content || []).map((c: Record<string, unknown>) => c.text || '').join('');
        if (currentHeading && text.length > 20) {
          currentBody.push(text);
        }
      }
      if (node.content && Array.isArray(node.content)) {
        for (const child of node.content) {
          if (typeof child === 'object' && child !== null) {
            traverse(child as Record<string, unknown>);
          }
        }
      }
    }
    
    traverse(parsed);
    
    if (currentHeading && currentBody.length > 0 && sections.length < 3) {
      sections.push({
        heading: currentHeading,
        body: currentBody.join(' ').slice(0, 200)
      });
    }
  } catch {
    // ignore parse errors
  }
  
  return sections.slice(0, 3);
}

function getEmailHtml(posts: Post[], unsubUrl: string) {
  const now = new Date();
  const issueNum = getIssueNumber();
  const month = getMonthName(now);
  const year = getYear(now);
  
  const mainPost = posts[0];
  
  const articleUrl = mainPost ? `${BASE_URL}/blog/${mainPost.slug}` : "#";
  const readingTime = mainPost?.reading_time || 5;
  const category = mainPost?.category?.toUpperCase() || "DEEPDIVE";
  const pullQuote = getPullQuote(mainPost);
  const stats = getStatsForPost(mainPost);
  const sections = extractSectionsFromPost(mainPost);
  
  const statCards = stats.length > 0 
    ? stats.map(s => `
      <div style="flex:1;background:#F0FDF4;border:1px solid #BBF7D0;border-radius:8px;padding:14px 12px;text-align:center;">
        <div style="font-size:22px;font-weight:700;color:#166534;line-height:1;">${s.value}</div>
        <div style="font-size:10px;color:#6B7280;margin-top:4px;letter-spacing:0.3px;">${s.label}</div>
      </div>
    `).join('')
    : '';
  
  const sectionBlocks = sections.length > 0
    ? sections.map((s, i) => `
      <div style="margin:20px 0;">
        <h2 style="font-family:Georgia,serif;font-size:17px;font-weight:bold;color:#14532D;margin-bottom:8px;padding-bottom:6px;border-bottom:2px solid #DCFCE7;">
          0${i + 1}/ ${s.heading}
        </h2>
        <p style="font-size:15px;line-height:1.75;color:#374151;">${s.body}</p>
      </div>
    `).join('')
    : '';

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<meta http-equiv="X-UA-Compatible" content="IE=edge">
<title>EVPulse – #${issueNum} | ${mainPost?.title || 'Newsletter'}</title>
<style>
* { margin: 0; padding: 0; box-sizing: border-box; }
body, table, td, p, a, li, blockquote { -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%; }
table, td { mso-table-lspace: 0pt; mso-table-rspace: 0pt; border-collapse: collapse; }
img { border: 0; outline: none; text-decoration: none; -ms-interpolation-mode: bicubic; display: block; }
a { color: inherit; }
body { background-color: #E8F5E9; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif; color: #374151; }
.email-wrapper { width: 100%; background-color: #E8F5E9; padding: 24px 0 40px; }
.email-container { max-width: 600px; margin: 0 auto; background-color: #FAFAF7; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 24px rgba(22, 101, 52, 0.10); }
.header { background-color: #166534; padding: 0; text-align: center; }
.header-top-stripe { background-color: #4ADE80; height: 3px; }
.header-inner { padding: 22px 32px 18px; }
.header-logo { font-family: Georgia, 'Times New Roman', serif; font-size: 32px; font-weight: bold; color: #FFFFFF; letter-spacing: -1px; text-decoration: none; display: inline-block; line-height: 1; }
.header-logo span { color: #4ADE80; }
.header-tagline { font-size: 10px; letter-spacing: 2.5px; color: #86EFAC; text-transform: uppercase; margin-top: 6px; }
.header-meta { margin-top: 12px; border-top: 1px solid rgba(74, 222, 128, 0.25); padding-top: 10px; display: flex; justify-content: center; gap: 24px; flex-wrap: wrap; }
.header-meta a { font-size: 11px; color: #86EFAC; text-decoration: none; letter-spacing: 0.5px; }
.intro-banner { background-color: #DCFCE7; border-left: 4px solid #16A34A; margin: 24px 28px 0; border-radius: 0 8px 8px 0; padding: 12px 16px; }
.intro-banner-title { font-size: 12px; font-weight: 600; color: #166534; letter-spacing: 0.5px; text-transform: uppercase; }
.intro-banner-text { font-size: 14px; color: #374151; margin-top: 3px; line-height: 1.5; }
.intro-banner-text em { color: #16A34A; font-style: italic; }
.article-section { padding: 24px 28px 0; }
.article-tag { display: inline-block; background-color: #DCFCE7; color: #166534; font-size: 10px; font-weight: 700; letter-spacing: 1.5px; text-transform: uppercase; padding: 4px 10px; border-radius: 4px; }
.article-headline { font-family: Georgia, 'Times New Roman', serif; font-size: 26px; font-weight: bold; color: #14532D; line-height: 1.25; margin-top: 12px; letter-spacing: -0.3px; }
.article-meta { font-size: 11px; color: #9CA3AF; margin-top: 8px; letter-spacing: 0.5px; }
.article-divider { border: none; border-top: 1px solid #D1FAE5; margin: 16px 0; }
.article-intro { font-size: 15px; line-height: 1.7; color: #374151; }
.pull-quote { background-color: #F0FDF4; border-left: 4px solid #16A34A; border-radius: 0 8px 8px 0; padding: 14px 18px; margin: 20px 0; }
.pull-quote-text { font-family: Georgia, 'Times New Roman', serif; font-size: 16px; font-style: italic; color: #14532D; line-height: 1.6; }
.pull-quote-attr { font-size: 11px; color: #6B7280; margin-top: 8px; }
.stats-row { display: flex; gap: 12px; margin: 20px 0; }
.stat-card { flex: 1; background-color: #F0FDF4; border: 1px solid #BBF7D0; border-radius: 8px; padding: 14px 12px; text-align: center; }
.stat-value { font-size: 22px; font-weight: 700; color: #166534; line-height: 1; }
.stat-label { font-size: 10px; color: #6B7280; margin-top: 4px; letter-spacing: 0.3px; }
.cta-wrap { text-align: center; margin: 28px 0 8px; }
.cta-btn { display: inline-block; background-color: #166534; color: #FFFFFF !important; font-size: 14px; font-weight: 700; letter-spacing: 0.5px; text-decoration: none; padding: 14px 32px; border-radius: 6px; }
.cta-btn:hover { background-color: #14532D; }
.cta-secondary { display: inline-block; margin-top: 10px; font-size: 13px; color: #16A34A; text-decoration: underline; }
.footer { background-color: #166534; padding: 24px 28px; margin-top: 28px; }
.footer-logo { font-family: Georgia, 'Times New Roman', serif; font-size: 20px; font-weight: bold; color: #FFFFFF; text-decoration: none; }
.footer-logo span { color: #4ADE80; }
.footer-tagline { font-size: 11px; color: #86EFAC; margin-top: 4px; }
.footer-links { margin-top: 16px; border-top: 1px solid rgba(74, 222, 128, 0.2); padding-top: 14px; display: flex; gap: 20px; flex-wrap: wrap; }
.footer-links a { font-size: 11px; color: #86EFAC; text-decoration: none; }
.footer-legal { font-size: 10px; color: rgba(134, 239, 172, 0.6); margin-top: 14px; line-height: 1.6; }
.footer-legal a { color: rgba(134, 239, 172, 0.8); text-decoration: underline; }
@media screen and (max-width: 640px) {
  .email-wrapper { padding: 0 !important; }
  .email-container { border-radius: 0 !important; box-shadow: none !important; }
  .header-inner { padding: 18px 20px 14px !important; }
  .header-logo { font-size: 26px !important; }
  .intro-banner { margin: 16px 16px 0 !important; }
  .article-section { padding: 18px 16px 0 !important; }
  .article-headline { font-size: 22px !important; }
  .stats-row { flex-direction: column !important; }
  .footer { padding: 20px 16px !important; }
  .cta-btn { display: block !important; text-align: center !important; padding: 14px 20px !important; }
}
</style>
</head>
<body>
<div class="email-wrapper">
<div class="email-container">
  <div class="header">
    <div class="header-top-stripe"></div>
    <div class="header-inner">
      <a href="${BASE_URL}" class="header-logo">EV<span>Pulse</span></a>
      <p class="header-tagline">Engineering Clarity for the EV Era</p>
      <div class="header-meta">
        <a href="${BASE_URL}/battery">Battery Status</a>
        <a href="${BASE_URL}/charging">Charging</a>
        <a href="${BASE_URL}/policy">Policy</a>
        <a href="${BASE_URL}/tools">Tools</a>
      </div>
    </div>
  </div>

  <div class="intro-banner">
    <div class="intro-banner-title">#${issueNum} · ${month} ${year}</div>
    <div class="intro-banner-text">
      ${mainPost?.excerpt?.slice(0, 120) || 'Thanks for being part of EVPulse. This week we dive into something that matters for every EV engineer.'}...
      <em>Stick around for stats that might surprise you.</em>
    </div>
  </div>

  <div class="article-section">
    <span class="article-tag">${category}</span>
    <h1 class="article-headline">${mainPost?.title || 'EVPulse Newsletter'}</h1>
    <p class="article-meta">${readingTime} MIN READ &nbsp;·&nbsp; BY CHAITANYA, EV BATTERY ENGINEER</p>
    <hr class="article-divider">
    <p class="article-intro">
      Hey — thanks for being part of EVPulse. ${mainPost?.excerpt?.slice(0, 150) || 'This week we explore the latest in EV battery technology and engineering.'}...
    </p>

    <div class="pull-quote">
      <p class="pull-quote-text">"${pullQuote}"</p>
      <p class="pull-quote-attr">— Chaitanya, EV Battery Engineer</p>
    </div>

    ${sectionBlocks}

    ${statCards ? `<div class="stats-row">${statCards}</div>` : ''}

    <div class="cta-wrap">
      <a href="${articleUrl}" class="cta-btn">Read Full Article →</a>
      <br>
      <a href="${BASE_URL}/blog" class="cta-secondary">Browse all articles</a>
    </div>
  </div>

  <div class="footer">
    <a href="${BASE_URL}" class="footer-logo">EV<span>Pulse</span></a>
    <p class="footer-tagline">Engineering clarity for the EV era · evpulse.co.in</p>
    <div class="footer-links">
      <a href="${BASE_URL}">Website</a>
      <a href="${BASE_URL}/blog">Articles</a>
      <a href="${BASE_URL}/tools">Tools</a>
      <a href="${BASE_URL}/policy">Policy</a>
      <a href="mailto:hello@evpulse.co.in">Contact</a>
    </div>
    <p class="footer-legal">
      You're receiving this because you subscribed at evpulse.co.in.<br>
      <a href="${unsubUrl}">Unsubscribe</a> &nbsp;·&nbsp;
      <a href="${BASE_URL}/privacy">Privacy Policy</a> &nbsp;·&nbsp;
      © 2026 EVPulse. All rights reserved.
    </p>
  </div>
</div>
</div>
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
      sender: { email: "chaitanya_dasari@evpulse.co.in", name: "EVPulse" },
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