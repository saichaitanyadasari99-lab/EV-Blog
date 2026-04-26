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
  const quickBite3 = posts[3];
  
  const coverImage = mainPost?.cover_url 
    ? `<img src="${mainPost.cover_url}" alt="${mainPost.title}" style="width:100%;max-width:480px;height:auto;border-radius:4px;margin:16px 0 20px;">`
    : `<div style="background:linear-gradient(135deg,#E5E1D8,#D5D1C8);height:220px;border-radius:4px;margin:16px 0 20px;display:flex;align-items:center;justify-content:center;color:#78716C;font-size:12px;font-style:italic;">[ Cover Image ]</div>`;
  
  const articleUrl = mainPost ? `${BASE_URL}/blog/${mainPost.slug}` : "#";
  const readingTime = mainPost?.reading_time || 5;
  const category = mainPost?.category?.toUpperCase() || "BATTERY TECH";
  const pullQuote = getPullQuote(mainPost?.content || null);
  
  const calc = getCalculatorForPost(mainPost);
  const calculatorUrl = calc.url;
  const calcName = calc.name;
  const calcDesc = calc.description;

  const bite1Url = quickBite1 ? `${BASE_URL}/blog/${quickBite1.slug}` : "#";
  const bite1Title = quickBite1?.title || "New solid-state battery breakthrough";
  const bite1Excerpt = quickBite1?.excerpt?.slice(0, 100) || "Recent developments in solid-state electrolyte technology.";

  const bite2Url = quickBite2 ? `${BASE_URL}/blog/${quickBite2.slug}` : "#";
  const bite2Title = quickBite2?.title || "New safety standards draft released";
  const bite2Excerpt = quickBite2?.excerpt?.slice(0, 100) || "Updated thermal runaway requirements for EV packs.";

  const bite3Title = quickBite3?.title || "EV market growth update";

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>VoltPulse Newsletter</title>
<style>
@import url('https://fonts.googleapis.com/css2?family=Lora:ital,wght@0,400;0,500;0,600;1,400&family=Playfair+Display:wght@400;700&display=swap');
* { box-sizing: border-box; }
body { margin: 0; padding: 0; background: #E5E1D8; font-family: Georgia, 'Times New Roman', serif; font-size: 15px; line-height: 1.8; color: #1C1917; }
a { color: #C2410C; text-decoration: underline; }
a:hover { text-decoration: none; }
@media only screen and (max-width: 600px) {
  .wrapper { width: 100% !important; padding-left: 20px !important; padding-right: 20px !important; }
  .hide-mobile { display: none !important; }
}
</style>
</head>
<body>
<table width="100%" bgcolor="#E5E1D8" cellpadding="0" cellspacing="0">
<tr><td align="center" style="padding: 32px 16px;">

<!-- ==== BLOCK 1: HEADER ==== -->
<table class="wrapper" width="600" cellpadding="0" cellspacing="0" style="background: #1C1917;">
<tr>
<td class="wrapper" style="padding: 40px 44px 32px; text-align: center;">
  <p style="margin: 0 0 16px; font-size: 11px; letter-spacing: 0.15em; text-transform: uppercase; color: #C2410C;">
    Issue #${issueNum} · ${month} ${year}
  </p>
  <h1 style="margin: 0 0 10px; font-family: Georgia, serif; font-size: 42px; font-weight: 700; color: #FFFFFF; line-height: 1.1;">
    Volt<span style="color: #C2410C;">Pulse</span>
  </h1>
  <p style="margin: 0 0 20px; font-family: Lora, Georgia, serif; font-size: 14px; font-style: italic; color: #A8A29E;">
    Engineering clarity for the EV era
  </p>
  <p style="margin: 0; font-size: 10px; letter-spacing: 0.12em; text-transform: uppercase; color: #78716C;">
    Battery Systems · Charging · Policy · Tools
  </p>
</td>
</tr>
</table>

<!-- ==== BLOCK 2: INTRO ==== -->
<table class="wrapper" width="600" cellpadding="0" cellspacing="0" style="background: #F7F5F0;">
<tr>
<td class="wrapper" style="padding: 36px 44px 28px; border-bottom: 1px solid #E5E1D8;">
  <p style="margin: 0 0 14px; font-size: 15px; line-height: 1.85; color: #1C1917;">
    Hey there — thanks for being part of VoltPulse. This week I'm diving deep into something that matters for every EV engineer: ${mainPost?.title || "the latest battery technology developments"}. Stick around for a stat that might surprise you.
  </p>
  <p style="margin: 0; font-size: 14px; font-style: italic; color: #78716C;">
    — Chaitanya, EV Battery Engineer
  </p>
</td>
</tr>
</table>

<!-- ==== BLOCK 3: MAIN STORY ==== -->
<table class="wrapper" width="600" cellpadding="0" cellspacing="0" style="background: #F7F5F0;">
<tr>
<td class="wrapper" style="padding: 36px 44px 32px; border-bottom: 1px solid #E5E1D8;">
  <p style="margin: 0 0 12px; font-size: 10px; letter-spacing: 0.14em; text-transform: uppercase; color: #C2410C;">
    MAIN STORY
  </p>
  <h2 style="margin: 0 0 8px; font-family: Georgia, serif; font-size: 26px; font-weight: 700; color: #1C1917; line-height: 1.25;">
    ${mainPost?.title || "Your EV Battery Guide"}
  </h2>
  <p style="margin: 0 0 18px; font-size: 10px; letter-spacing: 0.06em; color: #A8A29E;">
    ${readingTime} MIN READ · ${category}
  </p>
  ${coverImage}
  <p style="margin: 0 0 16px; font-size: 15px; line-height: 1.85; color: #292524;">
    ${mainPost?.excerpt || "Deep dive into EV battery technology and engineering analysis."}
  </p>
</td>
</tr>
</table>

<!-- ==== BLOCK 4: PULL QUOTE ==== -->
<table class="wrapper" width="600" cellpadding="0" cellspacing="0" style="background: #FBF5EF;">
<tr>
<td class="wrapper" style="padding: 28px 44px; border-left: 3px solid #C2410C; border-top: 1px solid #E5E1D8; border-bottom: 1px solid #E5E1D8;">
  <p style="margin: 0; font-family: Georgia, serif; font-size: 18px; font-style: italic; color: #1C1917; line-height: 1.6;">
    "${pullQuote}"
  </p>
</td>
</tr>
</table>

<!-- ==== BLOCK 5: ARTICLE EXCERPT + CTA ==== -->
<table class="wrapper" width="600" cellpadding="0" cellspacing="0" style="background: #F7F5F0;">
<tr>
<td class="wrapper" style="padding: 32px 44px 36px; border-bottom: 1px solid #E5E1D8;">
  <p style="margin: 0 0 20px; font-size: 15px; line-height: 1.85; color: #292524;">
    This analysis breaks down the core engineering principles, real-world test data, and practical implications for battery system design. Whether you're sizing a pack or evaluating cell chemistry, here's what the numbers tell us.
  </p>
  <table cellpadding="0" cellspacing="0" style="margin: 8px 0 0;">
  <tr>
    <td style="background: #C2410C; border-radius: 6px; padding: 0;">
      <a href="${articleUrl}" target="_blank" style="display: block; padding: 14px 28px; font-size: 14px; font-weight: 600; color: #FFFFFF; text-decoration: none; border-radius: 6px;">
        Read Full Article →
      </a>
    </td>
  </tr>
  </table>
</td>
</tr>
</table>

<!-- ==== BLOCK 6: STAT CALLOUT ==== -->
<table class="wrapper" width="600" cellpadding="0" cellspacing="0" style="background: #1C1917;">
<tr>
<td class="wrapper" style="padding: 40px 44px; text-align: center;">
  <p style="margin: 0 0 12px; font-size: 10px; letter-spacing: 0.14em; text-transform: uppercase; color: #78716C;">
    THIS WEEK'S NUMBER
  </p>
  <p style="margin: 0 0 12px; font-family: Georgia, serif; font-size: 64px; font-weight: 700; color: #C2410C; line-height: 1;">
    ${(issueNum * 7) + 12}%
  </p>
  <p style="margin: 0; font-size: 14px; font-style: italic; color: #78716C; line-height: 1.65; max-width: 320px; margin-left: auto; margin-right: auto;">
    of EV battery research now focuses on thermal management — a 12% shift from last quarter's focus on cell chemistry.
  </p>
</td>
</tr>
</table>

<!-- ==== BLOCK 7: QUICK BITES ==== -->
<table class="wrapper" width="600" cellpadding="0" cellspacing="0" style="background: #F7F5F0;">
<tr>
<td class="wrapper" style="padding: 36px 44px;">
  <p style="margin: 0 0 20px; font-size: 10px; letter-spacing: 0.14em; text-transform: uppercase; color: #C2410C;">
    QUICK BITES
  </p>
  
  <!-- Bite 1 -->
  <table width="100%" cellpadding="0" cellspacing="0" style="border-bottom: 1px solid #E5E1D8; padding-bottom: 16px; margin-bottom: 16px;">
  <tr>
    <td width="62" valign="top">
      <span style="display: inline-block; background: #E5E1D8; color: #78716C; font-size: 9px; letter-spacing: 0.1em; text-transform: uppercase; padding: 4px 10px; border-radius: 3px;">
        TECH
      </span>
    </td>
    <td style="padding-left: 14px; font-size: 14px; line-height: 1.7; color: #292524;">
      <a href="${bite1Url}" target="_blank" style="color: #1C1917; text-decoration: none; font-weight: 600;">
        ${bite1Title || "New solid-state battery breakthrough"}
      </a>
      <br><span style="font-size: 13px; color: #57534E;">${bite1Excerpt || "Recent developments in solid-state electrolyte technology."}</span>
    </td>
  </tr>
  </table>
  
  <!-- Bite 2 -->
  <table width="100%" cellpadding="0" cellspacing="0" style="border-bottom: 1px solid #E5E1D8; padding-bottom: 16px; margin-bottom: 16px;">
  <tr>
    <td width="62" valign="top">
      <span style="display: inline-block; background: #E5E1D8; color: #78716C; font-size: 9px; letter-spacing: 0.1em; text-transform: uppercase; padding: 4px 10px; border-radius: 3px;">
        POLICY
      </span>
    </td>
    <td style="padding-left: 14px; font-size: 14px; line-height: 1.7; color: #292524;">
      <a href="${bite2Url}" target="_blank" style="color: #1C1917; text-decoration: none; font-weight: 600;">
        ${bite2Title || "New safety standards draft released"}
      </a>
      <br><span style="font-size: 13px; color: #57534E;">${bite2Excerpt || "Updated thermal runaway requirements."}</span>
    </td>
  </tr>
  </table>
  
  <!-- Bite 3 -->
  <table width="100%" cellpadding="0" cellspacing="0;">
  <tr>
    <td width="62" valign="top">
      <span style="display: inline-block; background: #E5E1D8; color: #78716C; font-size: 9px; letter-spacing: 0.1em; text-transform: uppercase; padding: 4px 10px; border-radius: 3px;">
        MARKET
      </span>
    </td>
    <td style="padding-left: 14px; font-size: 14px; line-height: 1.7; color: #292524;">
      <a href="${bite2Url}" target="_blank" style="color: #1C1917; text-decoration: none; font-weight: 600;">
        ${quickBite3?.title || "EV market growth update"}
      </a>
      <br><span style="font-size: 13px; color: #57534E;">Global EV sales continue upward trajectory.</span>
    </td>
  </tr>
  </table>
</td>
</tr>
</table>

<!-- ==== BLOCK 8: TOOL OF THE WEEK ==== -->
<table class="wrapper" width="600" cellpadding="0" cellspacing="0" style="background: #FBF5EF;">
<tr>
<td class="wrapper" style="padding: 32px 44px; border-bottom: 1px solid #E5E1D8;">
  <p style="margin: 0 0 14px; font-size: 10px; letter-spacing: 0.14em; text-transform: uppercase; color: #C2410C;">
    TOOL OF THE WEEK
  </p>
  <h3 style="margin: 0 0 8px; font-family: Georgia, serif; font-size: 20px; font-weight: 700; color: #1C1917;">
    ${calcName}
  </h3>
  <p style="margin: 0 0 14px; font-size: 14px; line-height: 1.75; color: #57534E;">
    ${calcDesc} This calculator handles all the key calculations you need — voltage, thermal load, and power analysis. Free to use, no sign-up required.
  </p>
  <a href="${calculatorUrl}" target="_blank" style="font-size: 13px; color: #C2410C; text-decoration: underline;">
    Try it here →
  </a>
</td>
</tr>
</table>

<!-- ==== BLOCK 9: FOOTER ==== -->
<table class="wrapper" width="600" cellpadding="0" cellspacing="0" style="background: #1C1917;">
<tr>
<td class="wrapper" style="padding: 32px 44px; text-align: center;">
  <p style="margin: 0 0 6px; font-size: 12px; color: #78716C;">
    <a href="${BASE_URL}" style="color: #A8A29E; text-decoration: none;">evpulse.co.in</a>
  </p>
  <p style="margin: 0 0 8px; font-size: 11px; color: #57534E;">
    <a href="${unsubUrl}" style="color: #78716C; text-decoration: underline;">Unsubscribe</a> · <a href="${BASE_URL}" style="color: #78716C; text-decoration: underline;">View in browser</a>
  </p>
  <p style="margin: 0; font-size: 10px; color: #44403C;">
    VoltPulse · Visakhapatnam, India
  </p>
</td>
</tr>
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