import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";
import { getServerSupabaseClient } from "@/lib/supabase/server";
import { requireAdminUser } from "@/lib/auth";

const BATCH_SIZE = 100;

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
  
  try {
    const { data, error } = await supabase
      .from("newsletter_queue")
      .select("position, week_started")
      .order("created_at", { ascending: false })
      .limit(1)
      .single();
    
    if (error?.code === "PGRST116") {
      await supabase.from("newsletter_queue").insert({ position: 0 });
      return { position: 0, weekStarted: new Date().toISOString() };
    }
    
    if (data) {
      return { position: data.position ?? 0, weekStarted: data.week_started };
    }
    
    return { position: 0, weekStarted: null };
  } catch {
    await supabase.from("newsletter_queue").insert({ position: 0 });
    return { position: 0, weekStarted: new Date().toISOString() };
  }
}

async function resetQueue() {
  const supabase = await getServerSupabaseClient();
  await supabase.from("newsletter_queue").delete().neq("id", "00000000-0000-0000-0000-000000000000");
  await supabase.from("newsletter_queue").insert({ position: 0, week_started: new Date().toISOString() });
}

async function updateQueuePosition(newPosition: number) {
  const supabase = await getServerSupabaseClient();
  const { data } = await supabase.from("newsletter_queue").select("id").order("created_at", { ascending: false }).limit(1).single();
  if (data?.id) {
    await supabase.from("newsletter_queue").update({ position: newPosition }).eq("id", data.id);
  } else {
    await supabase.from("newsletter_queue").insert({ position: newPosition });
  }
}

function getEmailHtml(posts: Post[], unsubscribeUrl: string) {
  const postList = posts
    .map(
      (post) => `
    <div style="margin-bottom: 24px; padding-bottom: 16px; border-bottom: 1px solid #e5e7eb;">
      <h3 style="margin: 0 0 8px; font-size: 18px;">
        <a href="https://voltPulse.com/blog/${post.slug}" style="color: #22c55e; text-decoration: none;">
          ${post.title}
        </a>
      </h3>
      <p style="margin: 0; color: #6b7280; font-size: 14px;">
        ${post.excerpt || "Read more on VoltPulse..."}
      </p>
      <a href="https://voltPulse.com/blog/${post.slug}" style="color: #22c55e; font-size: 14px;">
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

export async function POST(request: NextRequest) {
  try {
    await requireAdminUser();
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const resend = new Resend(process.env.RESEND_API_KEY);

  if (!process.env.RESEND_API_KEY) {
    return NextResponse.json({ error: "RESEND_API_KEY not configured" }, { status: 500 });
  }

  try {
    const [subscribers, posts] = await Promise.all([getSubscribers(), getLatestPosts()]);

    if (posts.length === 0) {
      return NextResponse.json({ error: "No published posts to share" }, { status: 400 });
    }

    if (subscribers.length === 0) {
      return NextResponse.json({ error: "No subscribers found" }, { status: 400 });
    }

    const totalSubscribers = subscribers.length;
    const queueInfo = await getQueuePosition();
    let currentPosition = queueInfo.position;
    const weekStarted = new Date();
    
    if (currentPosition >= totalSubscribers) {
      currentPosition = 0;
      await resetQueue();
    }

    const startIdx = currentPosition;
    const endIdx = Math.min(currentPosition + BATCH_SIZE, totalSubscribers);
    const batch = subscribers.slice(startIdx, endIdx);
    const newPosition = endIdx;

    const unsubscribeBase = "https://voltPulse.com/api/newsletter/unsubscribe";
    const emailHtml = getEmailHtml(posts, unsubscribeBase);

    const results = await Promise.all(
      batch.map(async (subscriber) => {
        try {
          const personalizedHtml = emailHtml.replace(
            '{unsubscribe_email}',
            subscriber.email
          );
          
          await resend.emails.send({
            from: "VoltPulse <news@voltPulse.com>",
            to: subscriber.email,
            subject: `⚡ New EV Battery Content - ${posts[0].title}`,
            html: personalizedHtml,
          });
          return { email: subscriber.email, status: "sent" };
        } catch (err) {
          return { email: subscriber.email, status: "failed", error: String(err) };
        }
      })
    );

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
      .single();

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
    const currentPosition = queueData?.position ?? 0;
    const remaining = totalSubscribers - currentPosition;

    return NextResponse.json({
      totalSubscribers,
      pendingPosts,
      currentPosition,
      remainingThisWeek: Math.max(0, remaining),
      batchesRemaining: Math.ceil(Math.max(0, remaining) / BATCH_SIZE),
      weekStarted: queueData?.week_started,
    });
  } catch {
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