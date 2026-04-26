import { NextResponse } from "next/server";

export async function GET() {
  const apiKey = process.env.RESEND_API_KEY;
  
  if (!apiKey) {
    return NextResponse.json({ success: false, error: "RESEND_API_KEY not configured" });
  }

  const ADMIN_EMAIL = "saichaitanyadasari99@gmail.com";
  const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || "https://www.evpulse.co.in";
  const now = new Date();
  const issueNum = Math.floor((now.getFullYear() - 2025) * 12 + now.getMonth()) + 1;
  const month = now.toLocaleString("en-US", { month: "long" });
  const year = now.getFullYear().toString();

  const testHtml = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>VoltPulse Newsletter</title>
<link href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;700&family=Lora:ital,wght@0,400;0,500;1,400&display=swap" rel="stylesheet">
<style>
body{margin:0;padding:0;background:#ECEAE4;}
table{border-spacing:0;border-collapse:collapse;}
td{padding:0;}
@media only screen and (max-width:600px){.ec{width:100%!important;}.ps{padding-left:22px!important;padding-right:22px!important;}}
</style>
</head>
<body>
<table width="100%" bgcolor="#ECEAE4" cellpadding="0" cellspacing="0">
<tr><td align="center" style="padding:24px 12px;">
<table class="ec" width="600" cellpadding="0" cellspacing="0" style="background:#F7F5F0;">
  <tr><td bgcolor="#1C1917" align="center" class="ps" style="padding:34px 44px 28px;">
    <p style="margin:0 0 12px;font-family:Lora,Georgia,serif;font-size:10px;letter-spacing:0.14em;color:#C2410C;text-transform:uppercase;">Issue #${issueNum} · ${month} ${year}</p>
    <h1 style="margin:0 0 8px;font-family:'Playfair Display',Georgia,serif;font-size:38px;font-weight:700;color:#FBF8F3;line-height:1;">Volt<span style="color:#C2410C;">Pulse</span></h1>
    <p style="margin:0 0 20px;font-family:Lora,Georgia,serif;font-size:13px;color:rgba(251,248,243,0.45);font-style:italic;">Engineering clarity for the EV era</p>
    <p style="margin:0;font-family:Lora,Georgia,serif;font-size:10px;letter-spacing:0.1em;color:rgba(251,248,243,0.28);text-transform:uppercase;">Battery Systems · Charging · Policy · Tools</p>
  </td></tr>
  <tr><td class="ps" style="padding:32px 44px 28px;border-bottom:1px solid #E5E1D8;">
    <p style="margin:0 0 14px;font-family:Lora,Georgia,serif;font-size:15px;line-height:1.85;color:#1C1917;">Hey there — thanks for being here. This week I went deep on the latest EV battery developments. There's also a stat that surprised me, and three quick bites worth your 60 seconds.</p>
    <p style="margin:0;font-family:Lora,Georgia,serif;font-size:14px;font-style:italic;color:#78716C;">— Chaitanya, Battery Systems Engineer</p>
  </td></tr>
  <tr><td bgcolor="#1C1917" align="center" class="ps" style="padding:36px 44px;">
    <p style="margin:0 0 10px;font-family:Lora,Georgia,serif;font-size:10px;letter-spacing:0.14em;text-transform:uppercase;color:rgba(251,248,243,0.38);">This Week's Number</p>
    <p style="margin:0 0 10px;font-family:'Playfair Display',Georgia,serif;font-size:60px;font-weight:700;color:#C2410C;line-height:1;">${issueNum * 6 + 1}%</p>
    <p style="margin:0;font-family:Lora,Georgia,serif;font-size:14px;font-style:italic;color:rgba(251,248,243,0.58);line-height:1.65;max-width:310px;">increase in EV battery research interest this month — based on engagement across our technical content.</p>
  </td></tr>
  <tr><td class="ps" style="padding:36px 44px;border-bottom:1px solid #E5E1D8;">
    <p style="margin:0 0 18px;font-family:Lora,Georgia,serif;font-size:10px;letter-spacing:0.14em;text-transform:uppercase;color:#C2410C;">Quick Bites</p>
    <table width="100%" cellpadding="0" cellspacing="0" style="border-bottom:1px solid #ECEAE4;padding-bottom:14px;margin-bottom:14px;">
      <tr><td width="54" valign="top"><span style="display:inline-block;background:#E5E1D8;color:#78716C;font-size:9px;letter-spacing:0.1em;text-transform:uppercase;padding:3px 8px;border-radius:2px;font-family:Lora,Georgia,serif;">Policy</span></td>
        <td style="padding-left:12px;font-family:Lora,Georgia,serif;font-size:14px;line-height:1.68;color:#292524;"><strong style="color:#1C1917;font-weight:500;">New battery safety standards draft is out.</strong> The draft brings stricter thermal runaway requirements for commercial EV packs.</td></tr>
    </table>
    <table width="100%" cellpadding="0" cellspacing="0" style="border-bottom:1px solid #ECEAE4;padding-bottom:14px;margin-bottom:14px;">
      <tr><td width="54" valign="top"><span style="display:inline-block;background:#E5E1D8;color:#78716C;font-size:9px;letter-spacing:0.1em;text-transform:uppercase;padding:3px 8px;border-radius:2px;font-family:Lora,Georgia,serif;">Tech</span></td>
        <td style="padding-left:12px;font-family:Lora,Georgia,serif;font-size:14px;line-height:1.68;color:#292524;"><strong style="color:#1C1917;font-weight:500;">Solid-state pilot line hits 1000 cycles.</strong> New milestone shows promise for next-gen battery longevity.</td></tr>
    </table>
    <table width="100%" cellpadding="0" cellspacing="0">
      <tr><td width="54" valign="top"><span style="display:inline-block;background:#E5E1D8;color:#78716C;font-size:9px;letter-spacing:0.1em;text-transform:uppercase;padding:3px 8px;border-radius:2px;font-family:Lora,Georgia,serif;">Market</span></td>
        <td style="padding-left:12px;font-family:Lora,Georgia,serif;font-size:14px;line-height:1.68;color:#292524;"><strong style="color:#1C1917;font-weight:500;">LFP pack costs drop below $80/kWh.</strong> New pricing milestone makes LFP the unambiguous choice for mass-market EVs.</td></tr>
    </table>
  </td></tr>
  <tr><td bgcolor="#FBF5EF" class="ps" style="padding:30px 44px;border-bottom:1px solid #E5E1D8;">
    <p style="margin:0 0 14px;font-family:Lora,Georgia,serif;font-size:10px;letter-spacing:0.14em;text-transform:uppercase;color:#C2410C;">Tool of the Week</p>
    <h3 style="margin:0 0 8px;font-family:'Playfair Display',Georgia,serif;font-size:19px;font-weight:700;color:#1C1917;">Battery Pack Designer — VoltPulse</h3>
    <p style="margin:0 0 14px;font-family:Lora,Georgia,serif;font-size:14px;line-height:1.72;color:#57534E;">Sizing a new pack and don't want to start from scratch? The interactive calculator handles cell count, voltage window, thermal load, and cooling estimates in a single flow. Free, no sign-up.</p>
    <a href="${BASE_URL}/calculators" style="font-family:Lora,Georgia,serif;font-size:13px;color:#C2410C;text-decoration:underline;">Try the calculator →</a>
  </td></tr>
  <tr><td bgcolor="#1C1917" align="center" class="ps" style="padding:26px 44px;">
    <p style="margin:0 0 6px;font-family:Lora,Georgia,serif;font-size:11px;color:rgba(251,248,243,0.3);line-height:1.9;">You're receiving this because you subscribed at voltpulse.in</p>
    <p style="margin:0;font-family:Lora,Georgia,serif;font-size:11px;color:rgba(251,248,243,0.18);">VoltPulse · Visakhapatnam, India</p>
  </td></tr>
</table>
</td></tr>
</table>
</body>
</html>`;

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