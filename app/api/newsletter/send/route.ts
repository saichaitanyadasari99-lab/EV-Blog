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

function getPreheader(post: Post | null): string {
  const excerpt = post?.excerpt || "";
  return excerpt.slice(0, 140).replace(/<[^>]+>/g, "").trim();
}

function getSeriesBadge(post: Post | null): string {
  if (!post?.tags?.length) return "";
  const tags = post.tags.map(t => t.toLowerCase());
  const seriesKeywords = ["basic", "intermediate", "advanced", "expert", "master"];
  const tierMap: Record<string, string> = {
    basic: "Beginner",
    intermediate: "Intermediate",
    advanced: "Advanced",
    expert: "Expert",
    master: "Master Class",
  };
  for (const kw of seriesKeywords) {
    if (tags.includes(kw)) return `<span style="background-color:#ecfdf5; color:#065f46; font-size:10px; font-weight:700; letter-spacing:0.06em; text-transform:uppercase; padding:3px 10px; border-radius:20px; font-family:${fp};">${tierMap[kw] || kw.toUpperCase()}</span>`;
  }
  if (tags.some(t => t.includes("series"))) {
    return `<span style="background-color:#ecfdf5; color:#065f46; font-size:10px; font-weight:700; letter-spacing:0.06em; text-transform:uppercase; padding:3px 10px; border-radius:20px; font-family:${fp};">SERIES</span>`;
  }
  return "";
}

function getEmailHtml(posts: Post[], unsubUrl: string) {
  const issueNum = getIssueNumber();
  
  const post0 = posts[0] || null;
  const post1 = posts[1] || null;
  const post2 = posts[2] || null;
  
  const heroCategory = post0?.category?.toUpperCase() || "DEEP DIVE";
  const heroTitle = post0?.title || "Your EV Battery Guide";
  const heroCover = post0?.cover_url || "";
  const heroExcerpt = post0?.excerpt?.slice(0, 200) || "Deep dive into EV battery technology and engineering analysis.";
  const heroDate = post0?.created_at ? new Date(post0.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : "April 2026";
  const heroReadTime = post0?.reading_time || 5;
  const heroUrl = post0 ? `${BASE_URL}/blog/${post0.slug}` : "#";
  const heroSeriesBadge = getSeriesBadge(post0);
  
  const getCardData = (post: Post | null) => {
    if (!post) return null;
    return {
      category: post.category?.toUpperCase() || "ARTICLE",
      title: post.title || "Article",
      excerpt: post.excerpt?.slice(0, 120) || "Article description",
      cover: post.cover_url || "",
      slug: post.slug,
      badge: getSeriesBadge(post),
    };
  };
  
  const card1 = getCardData(post1);
  const card2 = getCardData(post2);

  const preheaderText = getPreheader(post0);

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <meta http-equiv="X-UA-Compatible" content="IE=edge" />
  <title>EVPulse — Issue #${issueNum}</title>
  <style>
    body { margin: 0; padding: 0; background-color: #f0efea; font-family: ${fp}; }
    a { text-decoration: none; }
    img { border: 0; display: block; }
    @media only screen and (max-width: 600px) {
      .wrapper { padding: 16px 12px !important; }
      .card { padding: 24px 20px !important; }
      .split-left, .split-right { display: block !important; width: 100% !important; }
      .split-img-mobile { width: 100% !important; height: 180px !important; margin-bottom: 16px !important; }
      .btn { display: block !important; text-align: center !important; }
    }
  </style>
</head>
<body>
  <!--[if !mso]><!-- -->
  <div style="display:none;font-size:1px;color:#f0efea;line-height:1px;max-height:0;max-width:0;opacity:0;overflow:hidden;">
    ${preheaderText}
  </div>
  <!--<![endif]-->
<div style="background-color:#f0efea; padding:0; margin:0;">
  <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#f0efea; padding:32px 16px;">
    <tr>
      <td align="center">
      <table width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:600px;">
        <!-- BRANDED HEADER -->
        <tr>
          <td style="background-color:#0099b8; border-radius:16px 16px 0 0; padding:28px 32px 22px; text-align:center;">
            <a href="${BASE_URL}" target="_blank" style="font-size:22px; font-weight:800; color:#ffffff; letter-spacing:-0.03em; font-family:${fp}; text-decoration:none;">⚡ EVPulse</a>
            <p style="margin:6px 0 0 0; font-size:12px; color:rgba(255,255,255,0.8); font-family:${fp};">Battery Engineering Dispatch · Issue #${issueNum}</p>
          </td>
        </tr>
        <!-- AUTHOR INTRO -->
        <tr>
          <td class="card" style="background-color:#ffffff; padding:28px 32px 12px; border-bottom:1px solid #e5e7eb;">
            <p style="margin:0 0 8px 0; font-size:14px; line-height:1.7; color:#4b5563; font-family:${fp};">Hey — Chaitanya here. This week I'm sharing the latest battery engineering analysis, benchmarks, and tools from EVPulse. Thanks for reading.</p>
          </td>
        </tr>
        <!-- LEAD STORY -->
        <tr>
          <td class="card" style="background-color:#ffffff; padding:24px 32px 32px;">
            <div style="margin-bottom:14px;">
              <span style="background-color:#0099b8; color:#ffffff; font-size:10px; font-weight:700; letter-spacing:0.08em; text-transform:uppercase; padding:3px 10px; border-radius:4px; font-family:${fp};">LEAD STORY</span>
              ${heroSeriesBadge ? `&nbsp;${heroSeriesBadge}` : ''}
            </div>
            <h1 style="margin:0 0 14px 0; font-size:22px; font-weight:700; line-height:1.25; letter-spacing:-0.02em; color:#0a0a0a; font-family:${fp};">
              ${heroTitle}
            </h1>
            <div style="border-radius:12px; overflow:hidden; margin-bottom:18px; background-color:#f0fafb;">
              ${heroCover ? `<img src="${heroCover}" alt="" width="100%" style="width:100%; height:auto; max-height:300px; object-fit:cover; display:block;" />` : ''}
            </div>
            <p style="margin:0 0 16px 0; font-size:14px; line-height:1.65; color:#4b5563; font-family:${fp};">
              ${heroExcerpt}
            </p>
            <p style="margin:0 0 20px 0; font-size:11px; color:#9ca3af; font-family:${fp};">
              ${heroDate} · ${heroReadTime} min read
            </p>
            <table cellpadding="0" cellspacing="0" border="0">
              <tr>
                <td>
                  <a class="btn" href="${heroUrl}" target="_blank" style="display:inline-block; background-color:#0099b8; color:#ffffff; font-size:13px; font-weight:700; padding:11px 20px; border-radius:8px; font-family:${fp};">
                    Read article →
                  </a>
                </td>
                <td style="padding-left:10px;">
                  <a class="btn" href="${BASE_URL}/blogs" target="_blank" style="display:inline-block; background-color:#ffffff; color:#0a0a0a; font-size:13px; font-weight:600; padding:11px 20px; border-radius:8px; border:1.5px solid #d1d5db; font-family:${fp};">
                    All articles
                  </a>
                </td>
              </tr>
            </table>
          </td>
        </tr>
        <!-- CALCULATOR CTA (mid-email) -->
        <tr><td style="height:12px;"></td></tr>
        <tr>
          <td style="background-color:#0a0a0a; border-radius:16px; padding:28px 32px; text-align:center;">
            <p style="margin:0 0 4px 0; font-size:11px; font-weight:700; color:#0099b8; letter-spacing:0.1em; text-transform:uppercase; font-family:${fp};">FREE ENGINEERING TOOLS</p>
            <h2 style="margin:0 0 10px 0; font-size:20px; font-weight:700; line-height:1.25; color:#ffffff; font-family:${fp};">6 free EV battery calculators</h2>
            <p style="margin:0 0 20px 0; font-size:13px; line-height:1.6; color:#9ca3af; font-family:${fp};">Battery pack designer, thermal load analyzer, SOC estimator, cooling system sizing, bus bar &amp; fusing, charging time — all free, no sign-up.</p>
            <a href="${BASE_URL}/calculators" target="_blank" style="display:inline-block; background-color:#0099b8; color:#ffffff; font-size:13px; font-weight:700; padding:11px 24px; border-radius:8px; font-family:${fp};">Try the calculators →</a>
          </td>
        </tr>
        <!-- SECONDARY ARTICLES -->
        ${[card1, card2].filter(Boolean).map((card, i) => {
          const c = card!;
          const isLeftImg = i === 0;
          return `
        <tr><td style="height:12px;"></td></tr>
        <tr>
          <td style="background-color:#ffffff; border-radius:16px; padding:20px;">
            <table width="100%" cellpadding="0" cellspacing="0" border="0">
              <tr>
                ${isLeftImg ? `
                <td class="split-left split-img-mobile" valign="top" style="width:140px; padding-right:18px;">
                  ${c.cover ? `<img src="${c.cover}" alt="" width="140" style="width:140px; height:100px; object-fit:cover; border-radius:8px; display:block;" />` : `<div style="width:140px; height:100px; background:linear-gradient(135deg,#e0f2fe,#bae6fd); border-radius:8px;"></div>`}
                </td>
                <td class="split-right" valign="top">
                  ${c.badge ? `<p style="margin:0 0 6px 0;">${c.badge}</p>` : ''}
                  <h2 style="margin:0 0 6px 0; font-size:16px; font-weight:700; line-height:1.3; color:#0a0a0a; font-family:${fp};">${c.title}</h2>
                  <p style="margin:0 0 10px 0; font-size:12px; line-height:1.55; color:#6b7280; font-family:${fp};">${c.excerpt}</p>
                  <a href="${BASE_URL}/blog/${c.slug}" target="_blank" style="font-size:12px; font-weight:700; color:#0099b8; font-family:${fp};">Read article →</a>
                </td>` : `
                <td class="split-left" valign="top" style="padding-right:18px;">
                  ${c.badge ? `<p style="margin:0 0 6px 0;">${c.badge}</p>` : ''}
                  <h2 style="margin:0 0 6px 0; font-size:16px; font-weight:700; line-height:1.3; color:#0a0a0a; font-family:${fp};">${c.title}</h2>
                  <p style="margin:0 0 10px 0; font-size:12px; line-height:1.55; color:#6b7280; font-family:${fp};">${c.excerpt}</p>
                  <a href="${BASE_URL}/blog/${c.slug}" target="_blank" style="font-size:12px; font-weight:700; color:#0099b8; font-family:${fp};">Read article →</a>
                </td>
                <td class="split-right split-img-mobile" valign="top" style="width:140px;">
                  ${c.cover ? `<img src="${c.cover}" alt="" width="140" style="width:140px; height:100px; object-fit:cover; border-radius:8px; display:block;" />` : `<div style="width:140px; height:100px; background:linear-gradient(135deg,#e0f2fe,#bae6fd); border-radius:8px;"></div>`}
                </td>`}
              </tr>
            </table>
          </td>
        </tr>`}).join('')}
        <!-- FOOTER -->
        <tr><td style="height:20px;"></td></tr>
        <tr>
          <td style="text-align:center; padding-bottom:16px;">
            <table cellpadding="0" cellspacing="0" border="0" align="center" style="margin-bottom:18px;">
              <tr>
                <td style="padding:0 8px;">
                  <a href="${BASE_URL}" target="_blank" style="display:inline-block; width:34px; height:34px; background-color:#e5e7eb; border-radius:50%; text-align:center; line-height:34px; font-size:12px; font-weight:700; color:#374151; font-family:${fp};">W</a>
                </td>
                <td style="padding:0 8px;">
                  <a href="https://www.linkedin.com/company/evpulse" target="_blank" style="display:inline-block; width:34px; height:34px; background-color:#e5e7eb; border-radius:50%; text-align:center; line-height:34px; font-size:12px; font-weight:700; color:#374151; font-family:${fp};">in</a>
                </td>
                <td style="padding:0 8px;">
                  <a href="${BASE_URL}" target="_blank" style="display:inline-block; width:34px; height:34px; background-color:#e5e7eb; border-radius:50%; text-align:center; line-height:34px; font-size:12px; font-weight:700; color:#374151; font-family:${fp};">X</a>
                </td>
              </tr>
            </table>
            <p style="margin:0 0 4px 0; font-size:11px; color:#9ca3af; font-family:${fp};">
              <a href="${unsubUrl}" style="color:#9ca3af; text-decoration:underline;">Unsubscribe</a>
              &nbsp;&nbsp;·&nbsp;&nbsp;
              <a href="${unsubUrl}" style="color:#9ca3af; text-decoration:underline;">Manage preferences</a>
            </p>
            <p style="margin:0 0 18px 0; font-size:10px; color:#d1d5db; font-family:${fp};">© 2026 EVPulse. All rights reserved.</p>
            <a href="${BASE_URL}" target="_blank" style="font-size:15px; font-weight:800; color:#374151; letter-spacing:-0.02em; font-family:${fp}; text-decoration:none;">⚡ EVPulse</a>
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