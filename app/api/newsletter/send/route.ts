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
  created_at: string | null;
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
    let currentHeading = '';
    let currentBody: string[] = [];
    
    function traverse(node: { type?: string; attrs?: Record<string, unknown>; content?: unknown[] }) {
      const nodeAny = node as Record<string, unknown>;
      if (node.type === 'heading' && (nodeAny.attrs as Record<string, unknown>)?.level === 2) {
        if (currentHeading && currentBody.length > 0) {
          sections.push({
            heading: currentHeading,
            body: currentBody.join(' ').slice(0, 200)
          });
        }
        currentHeading = (node.content || []).map((c: unknown) => (c as Record<string, unknown>)?.text || '').join('');
        currentBody = [];
      } else if (node.type === 'paragraph' && node.content) {
        const text = (node.content || []).map((c: unknown) => (c as Record<string, unknown>)?.text || '').join('');
        if (currentHeading && text.length > 20) {
          currentBody.push(text);
        }
      }
      if (node.content && Array.isArray(node.content)) {
        for (const child of node.content) {
          if (typeof child === 'object' && child !== null) {
            traverse(child as { type?: string; attrs?: Record<string, unknown>; content?: unknown[] });
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
  const issueNum = getIssueNumber();
  
  const post0 = posts[0] || null;
  const post1 = posts[1] || null;
  const post2 = posts[2] || null;
  const post3 = posts[3] || null;
  
  const heroCategory = post0?.category?.toUpperCase() || "DEEP DIVE";
  const heroTitle = post0?.title || "Your EV Battery Guide";
  const heroCover = post0?.cover_url || "";
  const heroExcerpt = post0?.excerpt?.slice(0, 200) || "Deep dive into EV battery technology and engineering analysis.";
  const heroDate = post0?.created_at ? new Date(post0.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : "April 2026";
  const heroReadTime = post0?.reading_time || 5;
  const heroUrl = post0 ? `${BASE_URL}/blog/${post0.slug}` : "#";
  
  const getCardData = (post: Post | null, idx: number) => {
    if (!post) return { category: "ARTICLE", title: "Article Title", excerpt: "Article description", cover: "", slug: "blogs" };
    return {
      category: post.category?.toUpperCase() || "ARTICLE",
      title: post.title || "Article",
      excerpt: post.excerpt?.slice(0, 120) || "Article description",
      cover: post.cover_url || "",
      slug: post.slug,
    };
  };
  
  const card1 = getCardData(post1, 1);
  const card2 = getCardData(post2, 2);
  const card3 = getCardData(post3, 3);

  const fp = "-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif";

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <meta http-equiv="X-UA-Compatible" content="IE=edge" />
  <title>EVPulse Weekly — Issue #${issueNum}</title>
  <style>
    body { margin: 0; padding: 0; background-color: #f0efea; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif; }
    a { text-decoration: none; }
    img { border: 0; display: block; }
    @media only screen and (max-width: 600px) {
      .wrapper { padding: 16px 12px !important; }
      .card { padding: 24px 20px !important; }
      .hero-visual { display: none !important; }
      .split-left, .split-right { display: block !important; width: 100% !important; }
      .split-img { width: 100% !important; height: 180px !important; margin-bottom: 20px !important; }
      .split-text { padding: 0 !important; }
      .btn { display: block !important; text-align: center !important; width: auto !important; }
      h1.hero-title { font-size: 17px !important; }
      .footer-socials td { padding: 0 8px !important; }
    }
  </style>
</head>
<body>
<div style="background-color:#f0efea; padding:0; margin:0;">
  <table class="wrapper" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#f0efea; padding:32px 16px;">
    <tr>
      <td align="center">
      <table width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:600px;">
        <tr>
          <td style="padding: 0 0 20px 0;">
            <a href="${BASE_URL}" target="_blank" style="font-size:17px; font-weight:700; color:#0a0a0a; letter-spacing:-0.02em; font-family:${fp}; text-decoration:none;">
              ⚡ EVPulse
            </a>
          </td>
        </tr>
        <tr>
          <td class="card" style="background-color:#ffffff; border-radius:16px; padding:32px; margin-bottom:16px; display:block;">
            <div style="margin-bottom:16px;">
              <span style="background-color:#ecfdf5; color:#065f46; font-size:11px; font-weight:700; letter-spacing:0.08em; text-transform:uppercase; padding:4px 12px; border-radius:20px; font-family:${fp};">
                ${heroCategory}
              </span>
            </div>
            <h1 class="hero-title" style="margin:0 0 16px 0; font-size:30px; font-weight:700; line-height:1.2; letter-spacing:-0.025em; color:#0a0a0a; font-family:${fp};">
              ${heroTitle}
            </h1>
            <div class="hero-visual" style="border-radius:12px; overflow:hidden; margin-bottom:20px; background-color:#f0fafb; height:220px; text-align:center; line-height:220px;">
              ${heroCover ? `<img src="${heroCover}" alt="Article cover" width="100%" style="width:100%; height:220px; object-fit:cover; border-radius:12px; display:block;" />` : ''}
            </div>
            <p style="margin:0 0 24px 0; font-size:15px; line-height:1.65; color:#4b5563; font-family:${fp};">
              ${heroExcerpt}
            </p>
            <p style="margin:0 0 24px 0; font-size:12px; color:#9ca3af; font-family:${fp};">
              ${heroDate} &nbsp;·&nbsp; ${heroReadTime} min read
            </p>
            <table cellpadding="0" cellspacing="0" border="0">
              <tr>
                <td style="padding-right:10px;">
                  <a class="btn" href="${heroUrl}" target="_blank" style="display:inline-block; background-color:#0a0a0a; color:#ffffff; font-size:14px; font-weight:600; padding:12px 22px; border-radius:8px; font-family:${fp};">
                    Read article →
                  </a>
                </td>
                <td>
                  <a class="btn" href="${BASE_URL}/blogs" target="_blank" style="display:inline-block; background-color:#ffffff; color:#0a0a0a; font-size:14px; font-weight:600; padding:12px 22px; border-radius:8px; border:1.5px solid #e5e7eb; font-family:${fp};">
                    All articles
                  </a>
                </td>
              </tr>
            </table>
          </td>
        </tr>
        <tr><td style="height:12px;"></td></tr>
        <tr>
          <td class="card" style="background-color:#ffffff; border-radius:16px; padding:24px;">
            <table width="100%" cellpadding="0" cellspacing="0" border="0">
              <tr>
                <td class="split-left split-img" valign="top" style="width:160px; padding-right:20px;">
                  ${card1.cover ? `<img src="${card1.cover}" alt="Article thumbnail" width="160" style="width:160px; height:120px; object-fit:cover; border-radius:10px; display:block;" />` : `<div style="width:160px; height:120px; background:linear-gradient(135deg,#E8F5E9,#DCFCE7); border-radius:10px;"></div>`}
                </td>
                <td class="split-right split-text" valign="top">
                  <p style="margin:0 0 8px 0; font-size:16px; font-weight:700; color:#0e7490; font-family:${fp};">${card1.category}</p>
                  <h2 style="margin:0 0 8px 0; font-size:18px; font-weight:700; line-height:1.3; color:#0a0a0a; font-family:${fp};">${card1.title}</h2>
                  <p style="margin:0 0 14px 0; font-size:13px; line-height:1.6; color:#6b7280; font-family:${fp};">${card1.excerpt}</p>
                  <a href="${BASE_URL}/blog/${card1.slug}" target="_blank" style="display:inline-block; background-color:#ffffff; color:#0a0a0a; font-size:13px; font-weight:600; padding:9px 18px; border-radius:7px; border:1.5px solid #e5e7eb; font-family:${fp};">Read more →</a>
                </td>
              </tr>
            </table>
          </td>
        </tr>
        <tr><td style="height:12px;"></td></tr>
        <tr>
          <td class="card" style="background-color:#ffffff; border-radius:16px; padding:24px;">
            <table width="100%" cellpadding="0" cellspacing="0" border="0">
              <tr>
                <td class="split-left split-text" valign="top" style="padding-right:20px;">
                  <p style="margin:0 0 8px 0; font-size:16px; font-weight:700; color:#0e7490; font-family:${fp};">${card2.category}</p>
                  <h2 style="margin:0 0 8px 0; font-size:18px; font-weight:700; line-height:1.3; color:#0a0a0a; font-family:${fp};">${card2.title}</h2>
                  <p style="margin:0 0 14px 0; font-size:13px; line-height:1.6; color:#6b7280; font-family:${fp};">${card2.excerpt}</p>
                  <a href="${BASE_URL}/blog/${card2.slug}" target="_blank" style="display:inline-block; background-color:#ffffff; color:#0a0a0a; font-size:13px; font-weight:600; padding:9px 18px; border-radius:7px; border:1.5px solid #e5e7eb; font-family:${fp};">Read now →</a>
                </td>
                <td class="split-right split-img" valign="top" style="width:160px;">
                  ${card2.cover ? `<img src="${card2.cover}" alt="Article thumbnail" width="160" style="width:160px; height:120px; object-fit:cover; border-radius:10px; display:block;" />` : `<div style="width:160px; height:120px; background:linear-gradient(135deg,#E8F5E9,#DCFCE7); border-radius:10px;"></div>`}
                </td>
              </tr>
            </table>
          </td>
        </tr>
        <tr><td style="height:12px;"></td></tr>
        <tr>
          <td class="card" style="background-color:#ffffff; border-radius:16px; padding:24px;">
            <table width="100%" cellpadding="0" cellspacing="0" border="0">
              <tr>
                <td class="split-left split-img" valign="top" style="width:160px; padding-right:20px;">
                  ${card3.cover ? `<img src="${card3.cover}" alt="Article thumbnail" width="160" style="width:160px; height:120px; object-fit:cover; border-radius:10px; display:block;" />` : `<div style="width:160px; height:120px; background:linear-gradient(135deg,#E8F5E9,#DCFCE7); border-radius:10px;"></div>`}
                </td>
                <td class="split-right split-text" valign="top">
                  <p style="margin:0 0 8px 0; font-size:16px; font-weight:700; color:#0e7490; font-family:${fp};">${card3.category}</p>
                  <h2 style="margin:0 0 8px 0; font-size:18px; font-weight:700; line-height:1.3; color:#0a0a0a; font-family:${fp};">${card3.title}</h2>
                  <p style="margin:0 0 14px 0; font-size:13px; line-height:1.6; color:#6b7280; font-family:${fp};">${card3.excerpt}</p>
                  <a href="${BASE_URL}/blog/${card3.slug}" target="_blank" style="display:inline-block; background-color:#ffffff; color:#0a0a0a; font-size:13px; font-weight:600; padding:9px 18px; border-radius:7px; border:1.5px solid #e5e7eb; font-family:${fp};">Read more →</a>
                </td>
              </tr>
            </table>
          </td>
        </tr>
        <tr><td style="height:12px;"></td></tr>
        <tr>
          <td class="card" style="background-color:#0a0a0a; border-radius:16px; padding:32px; text-align:center;">
            <p style="margin:0 0 6px 0; font-size:16px; font-weight:700; color:#0e7490; font-family:${fp};">FREE TOOLS</p>
            <h2 style="margin:0 0 12px 0; font-size:24px; font-weight:700; line-height:1.25; color:#ffffff; font-family:${fp};">6 free EV engineering calculators</h2>
            <p style="margin:0 0 24px 0; font-size:14px; line-height:1.65; color:#9ca3af; max-width:400px; margin-left:auto; margin-right:auto; font-family:${fp};">Battery pack designer, thermal load analyzer, SOC estimator, cooling system sizing, bus bar &amp; fusing, charging time — all free, all in your browser.</p>
            <a href="${BASE_URL}/calculators" target="_blank" style="display:inline-block; background-color:#ffffff; color:#0a0a0a; font-size:14px; font-weight:700; padding:13px 28px; border-radius:8px; font-family:${fp};">Try the calculators →</a>
          </td>
        </tr>
        <tr><td style="height:24px;"></td></tr>
        <tr>
          <td style="text-align:center; padding-bottom:16px;">
            <table class="footer-socials" cellpadding="0" cellspacing="0" border="0" align="center" style="margin-bottom:20px;">
              <tr>
                <td style="padding:0 10px;">
                  <a href="${BASE_URL}" target="_blank" style="display:inline-block; width:36px; height:36px; background-color:#e5e7eb; border-radius:50%; text-align:center; line-height:36px; font-size:13px; font-weight:700; color:#374151; font-family:${fp};">W</a>
                </td>
                <td style="padding:0 10px;">
                  <a href="https://www.linkedin.com/company/evpulse" target="_blank" style="display:inline-block; width:36px; height:36px; background-color:#e5e7eb; border-radius:50%; text-align:center; line-height:36px; font-size:13px; font-weight:700; color:#374151; font-family:${fp};">in</a>
                </td>
                <td style="padding:0 10px;">
                  <a href="${BASE_URL}" target="_blank" style="display:inline-block; width:36px; height:36px; background-color:#e5e7eb; border-radius:50%; text-align:center; line-height:36px; font-size:13px; font-weight:700; color:#374151; font-family:${fp};">X</a>
                </td>
              </tr>
            </table>
            <p style="margin:0 0 6px 0; font-size:12px; color:#9ca3af; font-family:${fp};">
              <a href="${unsubUrl}" style="color:#9ca3af; text-decoration:underline;">Manage preferences</a>
              &nbsp;&nbsp;
              <a href="${unsubUrl}" style="color:#9ca3af; text-decoration:underline;">Unsubscribe</a>
            </p>
            <p style="margin:0 0 20px 0; font-size:11px; color:#d1d5db; font-family:${fp};">© 2026 EVPulse. All rights reserved.<br/>evpulse.co.in</p>
            <a href="${BASE_URL}" target="_blank" style="font-size:14px; font-weight:700; color:#374151; letter-spacing:-0.02em; font-family:${fp}; text-decoration:none;">⚡ EVPulse</a>
          </td>
        </tr>
      </table>
      </td>
    </tr>
  </table>
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