import { NextResponse } from "next/server";

export async function GET() {
  const apiKey = process.env.SENDGRID_API_KEY;
  
  if (!apiKey) {
    return NextResponse.json({ 
      success: false, 
      error: "SENDGRID_API_KEY not configured. Add to Vercel env vars.",
      setup: "Go to https://sendgrid.com -> API Keys -> Create API Key"
    });
  }

  const ADMIN_EMAIL = "saichaitanyadasari99@gmail.com";

  const testHtml = `
<!DOCTYPE html>
<html><body style="margin:0;padding:20px;font-family:Arial,sans-serif;background:#f5f5f5;">
  <div style="max-width:600px;margin:0 auto;background:white;padding:25px;border-radius:10px;">
    <h1 style="color:#22c55e;margin:0 0 15px;">⚡ VoltPulse Newsletter</h1>
    <p>Test email from your newsletter!</p>
  </div>
</body></html>`;

  try {
    const res = await fetch("https://api.sendgrid.com/v3/mail/send", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        personalizations: [{ to: [{ email: ADMIN_EMAIL }] }],
        from: { email: ADMIN_EMAIL, name: "VoltPulse" },
        subject: "⚡ TEST: VoltPulse Newsletter",
        content: [{ type: "text/html", value: testHtml }],
      }),
    });

    if (!res.ok) {
      const err = await res.text();
      return NextResponse.json({ success: false, error: err });
    }

    return NextResponse.json({ success: true, message: "Test email sent!" });
  } catch (err) {
    return NextResponse.json({ success: false, error: String(err) });
  }
}