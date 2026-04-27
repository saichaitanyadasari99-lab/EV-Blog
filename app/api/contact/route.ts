import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

function getPublicSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}

type Payload = {
  name?: string;
  email?: string;
  subject?: string;
  message?: string;
  intent?: string;
};

function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

async function sendContactEmailBrevo(data: { name: string; email: string; subject: string; message: string }) {
  const apiKey = process.env.BREVO_API_KEY;
  if (!apiKey) {
    console.error("BREVO_API_KEY not configured");
    return;
  }

  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #1a1a1a; max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: linear-gradient(135deg, #00e5ff 0%, #0099b8 100%); padding: 20px; border-radius: 8px 8px 0 0; }
    .header h1 { margin: 0; color: #000; font-size: 24px; }
    .content { background: #f8f9fb; padding: 20px; border-radius: 0 0 8px 8px; }
    .field { margin-bottom: 16px; }
    .label { font-weight: 600; color: #4a5568; font-size: 12px; text-transform: uppercase; }
    .value { color: #1a1a1a; }
    .message-box { background: #fff; padding: 16px; border-radius: 8px; border: 1px solid #e0e4ec; white-space: pre-wrap; }
  </style>
</head>
<body>
  <div class="header">
    <h1>⚡ New Contact Form Submission</h1>
  </div>
  <div class="content">
    <div class="field">
      <div class="label">Name</div>
      <div class="value">${data.name}</div>
    </div>
    <div class="field">
      <div class="label">Email</div>
      <div class="value">${data.email}</div>
    </div>
    <div class="field">
      <div class="label">Subject</div>
      <div class="value">${data.subject}</div>
    </div>
    <div class="field">
      <div class="label">Message</div>
      <div class="message-box">${data.message}</div>
    </div>
    <div class="field" style="margin-top: 20px; font-size: 12px; color: #9aa3b2;">
      Submitted from EVPulse website contact form.
    </div>
  </div>
</body>
</html>`;

  const res = await fetch("https://api.brevo.com/v3/smtp/email", {
    method: "POST",
    headers: {
      "api-key": apiKey,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      sender: { email: "chaitanya_dasari@evpulse.co.in", name: "EVPulse Website" },
      to: [{ email: "chaitanya_dasari@evpulse.co.in" }],
      subject: `[Contact] ${data.subject}`,
      htmlContent: html,
    }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    console.error("Brevo error:", err);
    throw new Error(err.message || err.errorMessage || "Failed to send email");
  }

  return res.json();
}

export async function POST(request: Request) {
  const body = (await request.json()) as Payload;
  const name = (body.name ?? "").trim();
  const email = (body.email ?? "").trim().toLowerCase();
  const subject = (body.subject ?? "").trim();
  const message = (body.message ?? "").trim();
  const intent = (body.intent ?? "contact").trim();

  const supabase = getPublicSupabase();

  if (intent === "subscribe") {
    if (!email || !isValidEmail(email)) {
      return NextResponse.json({ error: "Valid email required." }, { status: 400 });
    }
    
    // Try INSERT first
    const { error } = await supabase.from("newsletter_subscribers").insert({
      email,
      full_name: name || "Subscriber",
      source: "website-subscribe",
      opted_in: true,
    });
    
    if (error) {
      // Check if it's a duplicate key error
      if (error.message.includes("duplicate key") || error.code === "23505") {
        return NextResponse.json({ error: "This email has already been registered." }, { status: 409 });
      }
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    
    return NextResponse.json({ success: true });
  }

  if (!name || !email || !subject || !message) {
    return NextResponse.json({ error: "All fields are required." }, { status: 400 });
  }
  if (!isValidEmail(email)) {
    return NextResponse.json({ error: "Invalid email format." }, { status: 400 });
  }

  const { error: subError } = await supabase.from("newsletter_subscribers").insert({
    email,
    full_name: name,
    source: "contact-form",
    opted_in: true,
  });

  if (subError) {
    if (subError.message.includes("duplicate key") || subError.code === "23505") {
      return NextResponse.json({ error: "This email has already been registered." }, { status: 409 });
    }
    return NextResponse.json(
      {
        error:
          subError.message.includes("relation")
            ? "Database tables not found. Run the new SQL setup for contact/newsletter tables."
            : subError.message,
      },
      { status: 500 },
    );
  }

  const { error: inquiryError } = await supabase.from("contact_submissions").insert({
    full_name: name,
    email,
    subject,
    message,
    intent,
  });

  if (inquiryError) {
    return NextResponse.json(
      {
        error:
          inquiryError.message.includes("relation")
            ? "Database tables not found. Run the new SQL setup for contact/newsletter tables."
            : inquiryError.message,
      },
      { status: 500 },
    );
  }

  try {
    await sendContactEmailBrevo({ name, email, subject, message });
  } catch (emailErr) {
    console.error("Failed to send notification email:", emailErr);
  }

  return NextResponse.json({ success: true });
}