import { NextResponse } from "next/server";

export async function GET() {
  const apiKey = process.env.MAILJET_API_KEY;
  const apiSecret = process.env.MAILJET_API_SECRET;
  
  if (!apiKey || !apiSecret) {
    return NextResponse.json({ success: false, error: "API keys not configured" });
  }

  const credentials = Buffer.from(`${apiKey}:${apiSecret}`).toString("base64");
  const ADMIN_EMAIL = "saichaitanyadasari99@gmail.com";

  const testHtml = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
</head>
<body style="margin: 0; padding: 20px; font-family: Arial, sans-serif; background-color: #f5f5f5;">
  <div style="max-width: 600px; margin: 0 auto; background: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
    <h1 style="color: #22c55e; margin: 0 0 20px 0;">⚡ VoltPulse Newsletter</h1>
    <p style="color: #666;">Hello! This is a test email to check the newsletter format.</p>
    <div style="margin: 20px 0; padding: 15px; background: #f9fafb; border-radius: 8px;">
      <h3 style="margin: 0 0 10px;">Sample Post Title</h3>
      <p style="margin: 0; color: #666;">This is a sample post excerpt that shows how your blog posts will appear in the newsletter...</p>
      <a href="#" style="color: #22c55e;">Read more →</a>
    </div>
    <p style="font-size: 12px; color: #999;">You're receiving this because you're subscribed to VoltPulse newsletter.</p>
  </div>
</body>
</html>
  `.trim();

  try {
    const response = await fetch("https://api.mailjet.com/v3.1/send", {
      method: "POST",
      headers: {
        "Authorization": `Basic ${credentials}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        Messages: [
          {
            From: { Email: "saichaitanyadasari99@gmail.com", Name: "VoltPulse" },
            To: [{ Email: ADMIN_EMAIL }],
            Subject: "⚡ TEST: VoltPulse Newsletter",
            HTMLPart: testHtml,
          },
        ],
      }),
    });

    const data = await response.json();
    
    if (!response.ok) {
      console.error("Mailjet error:", JSON.stringify(data));
      return NextResponse.json({ success: false, error: data });
    }
    
    return NextResponse.json({ success: true, message: "Test email sent!", data });
  } catch (err) {
    return NextResponse.json({ success: false, error: String(err) });
  }
}