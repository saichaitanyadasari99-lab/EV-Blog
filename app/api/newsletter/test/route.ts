import { NextResponse } from "next/server";

export async function GET() {
  const apiKey = process.env.RESEND_API_KEY;
  
  if (!apiKey) {
    return NextResponse.json({ success: false, error: "RESEND_API_KEY not configured" });
  }

  const ADMIN_EMAIL = "saichaitanyadasari99@gmail.com";

  const testHtml = `<!DOCTYPE html>
<html><body style="margin:0;padding:20px;font-family:Arial,sans-serif;background:#f5f5f5;">
  <div style="max-width:600px;margin:0 auto;background:white;padding:25px;border-radius:10px;">
    <h1 style="color:#22c55e;margin:0 0 15px;">⚡ VoltPulse Newsletter</h1>
    <p>Hello! This is a test email from your newsletter.</p>
  </div>
</body></html>`;

  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "VoltPulse <onboarding@resend.dev>",
        to: ADMIN_EMAIL,
        subject: "⚡ TEST: VoltPulse Newsletter",
        html: testHtml,
      }),
    });

    if (!res.ok) {
      const err = await res.json();
      return NextResponse.json({ success: false, error: err });
    }

    return NextResponse.json({ success: true, message: "Test email sent!" });
  } catch (err) {
    return NextResponse.json({ success: false, error: String(err) });
  }
}