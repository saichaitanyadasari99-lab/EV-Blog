import { NextRequest, NextResponse } from "next/server";
import { getServerSupabaseClient } from "@/lib/supabase/server";
import { requireAdminUser } from "@/lib/auth";

const BATCH_SIZE = 100;
const SENDER_EMAIL = "saichaitanyadasari99@gmail.com";
const SENDER_NAME = "VoltPulse";
const ADMIN_EMAIL = "saichaitanyadasari99@gmail.com";

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
  updated_at: string;
};

async function getLatestPosts(limit = 3): Promise<Post[]> {
  const supabase = await getServerSupabaseClient();
  const { data } = await supabase
    .from("posts")
    .select("id, title, slug, excerpt, updated_at")
    .eq("published", true)
    .order("updated_at", { ascending: false })
    .limit(limit);
  return (data ?? []) as Post[];
}

async function getSubscribers(): Promise<Subscriber[]> {
  const supabase = await getServerSupabaseClient();
  const { data } = await supabase
    .from("newsletter_subscribers")
    .select("id, email, full_name")
    .eq("opted_in", true);
  return (data ?? []) as Subscriber[];
}

async function getQueuePosition(): Promise<{ position: number; weekStarted: string | null }> {
  const supabase = await getServerSupabaseClient();
  
  const { data } = await supabase
    .from("newsletter_queue")
    .select("position, week_started")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (data) {
    return { position: data.position ?? 0, weekStarted: data.week_started };
  }
  
  await supabase.from("newsletter_queue").insert({ position: 0, week_started: new Date().toISOString() });
  return { position: 0, weekStarted: new Date().toISOString() };
}

async function resetQueue() {
  const supabase = await getServerSupabaseClient();
  await supabase.from("newsletter_queue").update({ position: 0, week_started: new Date().toISOString() });
}

async function updateQueuePosition(newPosition: number) {
  const supabase = await getServerSupabaseClient();
  const { data } = await supabase.from("newsletter_queue").select("id").order("created_at", { ascending: false }).limit(1).maybeSingle();
  if (data?.id) {
    await supabase.from("newsletter_queue").update({ position: newPosition }).eq("id", data.id);
  }
}

const BASE_URL = "https://ev-blog-post.vercel.app";

function getEmailHtml(posts: Post[], unsubscribeUrl: string) {
  const postList = posts
    .map(
      (post) => `
    <div style="margin-bottom: 24px; padding-bottom: 16px; border-bottom: 1px solid #e5e7eb;">
      <h3 style="margin: 0 0 8px; font-size: 18px;">
        <a href="${BASE_URL}/blog/${post.slug}" style="color: #22c55e; text-decoration: none;">
          ${post.title}
        </a>
      </h3>
      <p style="margin: 0; color: #6b7280; font-size: 14px;">
        ${post.excerpt || "Read more on VoltPulse..."}
      </p>
      <a href="${BASE_URL}/blog/${post.slug}" style="color: #22c55e; font-size: 14px;">
        Read more →
      </a>
    </div>
  `
    )
    .join("");

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f9fafb;">
  <div style="max-width: 600px; margin: 0 auto; padding: 32px 16px;">
    <div style="background: white; border-radius: 12px; padding: 32px; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
      <div style="margin-bottom: 24px;">
        <h1 style="margin: 0; font-size: 24px; color: #0f172a;">
          ⚡ VoltPulse Weekly
        </h1>
        <p style="margin: 8px 0 0; color: #6b7280; font-size: 14px;">
          Your EV Battery Design Updates
        </p>
      </div>
      
      ${postList}
      
      <div style="margin-top: 24px; padding-top: 16px; border-top: 1px solid #e5e7eb;">
        <p style="margin: 0; font-size: 12px; color: #9ca3af;">
          You're receiving this because you subscribed to VoltPulse newsletter.
          <br>
          <a href="${unsubscribeUrl}" style="color: #9ca3af;">Unsubscribe</a>
        </p>
      </div>
    </div>
  </div>
</body>
</html>
  `.trim();
}

async function sendEmailViaMailjet(toEmail: string, subject: string, htmlContent: string) {
  const apiKey = process.env.MAILJET_API_KEY;
  const apiSecret = process.env.MAILJET_API_SECRET;
  
  if (!apiKey || !apiSecret) {
    throw new Error("Mailjet API keys not configured");
  }

  const credentials = Buffer.from(`${apiKey}:${apiSecret}`).toString("base64");

  const response = await fetch("https://api.mailjet.com/v3.1/send", {
    method: "POST",
    headers: {
      "Authorization": `Basic ${credentials}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      Messages: [
        {
          From: {
            Email: SENDER_EMAIL,
            Name: SENDER_NAME,
          },
          To: [
            {
              Email: toEmail,
            },
          ],
          Subject: subject,
          HTMLPart: htmlContent,
        },
      ],
    }),
  });

  const data = await response.json();
  
  if (!response.ok) {
    console.error("Mailjet error:", JSON.stringify(data));
    throw new Error(data.ErrorMessage || "Failed to send email");
  }
  
  return data;
}

export async function POST(request: NextRequest) {
  try {
    await requireAdminUser();
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const isPreview = searchParams.get("preview") === "true";

  const apiKey = process.env.MAILJET_API_KEY;
  const apiSecret = process.env.MAILJET_API_SECRET;

  if (!apiKey || !apiSecret) {
    return NextResponse.json({ error: "MAILJET_API_KEY or MAILJET_API_SECRET not configured" }, { status: 500 });
  }

  try {
    const posts = await getLatestPosts();

    if (posts.length === 0) {
      return NextResponse.json({ error: "No published posts to share" }, { status: 400 });
    }

    // PREVIEW MODE - Send only to admin email
    if (isPreview) {
      console.log("Sending preview to:", ADMIN_EMAIL);
      
      const unsubscribeBase = "https://ev-blog-post.vercel.app/api/newsletter/unsubscribe";
      const emailHtml = getEmailHtml(posts, unsubscribeBase);
      
      try {
        await sendEmailViaMailjet(
          ADMIN_EMAIL,
          `⚡ PREVIEW: ${posts[0].title}`,
          emailHtml
        );
        
        return NextResponse.json({
          success: true,
          sent: 1,
          preview: true,
          recipient: ADMIN_EMAIL,
          postsShared: posts.map((p) => p.title),
          message: "Preview sent to your email address"
        });
      } catch (err) {
        return NextResponse.json({ error: "Failed to send preview", details: String(err) }, { status: 500 });
      }
    }

    // NORMAL MODE - Send to subscribers
    const subscribers = await getSubscribers();

    if (subscribers.length === 0) {
      return NextResponse.json({ error: "No subscribers found" }, { status: 400 });
    }

    const totalSubscribers = subscribers.length;
    console.log("Total subscribers:", totalSubscribers);
    console.log("Latest posts:", posts.map(p => p.title));
    
    const queueInfo = await getQueuePosition();
    let currentPosition = queueInfo.position;
    console.log("Current queue position:", currentPosition);
    
    if (currentPosition >= totalSubscribers) {
      currentPosition = 0;
      await resetQueue();
    }

    const startIdx = currentPosition;
    const endIdx = Math.min(currentPosition + BATCH_SIZE, totalSubscribers);
    
    console.log("Calculating batch: startIdx", startIdx, "endIdx", endIdx);
    
    if (startIdx >= endIdx) {
      console.log("No emails to send - batch range is empty");
      return NextResponse.json({ 
        error: "No emails to send in this batch. All subscribers may have been sent.",
        currentPosition,
        totalSubscribers
      });
    }
    
    const batch = subscribers.slice(startIdx, endIdx);
    const newPosition = endIdx;
    
    console.log("Batch calculated: startIdx:", startIdx, "endIdx:", endIdx);
    console.log("Batch size:", batch.length);
    console.log("First subscriber:", batch[0]?.email);

    if (batch.length === 0) {
      return NextResponse.json({ 
        error: "Batch is empty. Check subscribers.",
        startIdx,
        endIdx,
        totalSubscribers
      });
    }

    const unsubscribeBase = "https://ev-blog-post.vercel.app/api/newsletter/unsubscribe";
    const emailHtml = getEmailHtml(posts, unsubscribeBase);

    const results = [];
    
    // Send emails to all subscribers in batch
    for (const subscriber of batch) {
      console.log("Sending to:", subscriber.email);
      
      try {
        const res = await sendEmailViaMailjet(
          subscriber.email,
          `⚡ New EV Battery Content - ${posts[0]?.title || 'VoltPulse'}`,
          emailHtml
        );
        
        console.log("Mailjet response for", subscriber.email, ":", JSON.stringify(res));
        results.push({ email: subscriber.email, status: "sent" });
      } catch (err) {
        console.log("Exception sending to", subscriber.email, ":", err);
        results.push({ email: subscriber.email, status: "failed", error: String(err) });
      }
    }

    await updateQueuePosition(newPosition);

    const sentCount = results.filter((r) => r.status === "sent").length;
    const failedCount = results.filter((r) => r.status === "failed").length;

    return NextResponse.json({
      success: true,
      sent: sentCount,
      failed: failedCount,
      batch: {
        start: startIdx + 1,
        end: endIdx,
        total: totalSubscribers,
      },
      nextBatch: newPosition < totalSubscribers ? newPosition + 1 : null,
      postsShared: posts.map((p) => p.title),
      errors: results.filter((r) => r.status === "failed").map((r) => r.error),
    });
  } catch (error) {
    console.error("Newsletter error:", error);
    return NextResponse.json(
      { error: "Failed to send newsletter", details: String(error) },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    const supabase = await getServerSupabaseClient();
    
    const { data: queueData } = await supabase
      .from("newsletter_queue")
      .select("position, week_started")
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    let queuePosition = 0;
    let weekStarted = null;
    
    if (queueData) {
      queuePosition = queueData.position ?? 0;
      weekStarted = queueData.week_started;
    } else {
      await supabase.from("newsletter_queue").insert({ position: 0, week_started: new Date().toISOString() });
    }

    const [{ data: subscribersData }, { data: postsData }] = await Promise.all([
      supabase
        .from("newsletter_subscribers")
        .select("id")
        .eq("opted_in", true),
      supabase
        .from("posts")
        .select("id, title")
        .eq("published", true)
        .order("updated_at", { ascending: false })
        .limit(3),
    ]);

    const totalSubscribers = (subscribersData ?? []).length;
    const pendingPosts = (postsData ?? []).length;
    const remaining = totalSubscribers - queuePosition;

    return NextResponse.json({
      totalSubscribers,
      pendingPosts,
      currentPosition: queuePosition,
      remainingThisWeek: Math.max(0, remaining),
      batchesRemaining: Math.ceil(Math.max(0, remaining) / BATCH_SIZE),
      weekStarted,
    });
  } catch (error) {
    console.error("GET error:", error);
    return NextResponse.json({
      totalSubscribers: 0,
      pendingPosts: 0,
      currentPosition: 0,
      remainingThisWeek: 0,
      batchesRemaining: 0,
      weekStarted: null,
    });
  }
}