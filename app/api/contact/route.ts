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
    const { error } = await supabase.from("newsletter_subscribers").upsert(
      {
        email,
        full_name: name || "Subscriber",
        source: "website-subscribe",
        opted_in: true,
      },
      { onConflict: "email", ignoreDuplicates: true },
    );
    if (error && !error.message.toLowerCase().includes("duplicate")) {
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

  const { error: subError } = await supabase.from("newsletter_subscribers").upsert(
    {
      email,
      full_name: name,
      source: intent === "subscribe" ? "header-subscribe" : "contact-form",
      opted_in: true,
    },
    { onConflict: "email", ignoreDuplicates: true },
  );

  if (subError) {
    if (subError.message.toLowerCase().includes("duplicate key")) {
      return NextResponse.json({ success: true, duplicate: true });
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
    if (inquiryError.message.toLowerCase().includes("duplicate key")) {
      return NextResponse.json({ success: true, duplicate: true });
    }
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

  return NextResponse.json({ success: true });
}