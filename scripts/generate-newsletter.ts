import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const brevoApiKey = process.env.BREVO_API_KEY;
const senderEmail = process.env.NEWSLETTER_SENDER_EMAIL || 'your-email@domain.com';
const senderName = process.env.NEWSLETTER_SENDER_NAME || 'EVPulse';

const supabase = createClient(supabaseUrl!, supabaseKey!);

interface PostRecord {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  category: string;
  reading_time: number;
  created_at: string;
  published: boolean;
  author?: string;
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function extractTextContent(html: string): string {
  return html
    .replace(/<[^>]*>/g, '')
    .replace(/&nbsp;/g, ' ')
    .trim();
}

function getIssueNumber(): string {
  const now = new Date();
  const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  const monthYear = `${months[now.getMonth()]} ${now.getFullYear()}`;
  const startDate = new Date(2026, 3, 1);
  const monthsDiff = (now.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24 * 30);
  return `#${Math.floor(monthsDiff) + 10}`;
}

async function generateNewsletter() {
  console.log('Fetching latest article...\n');
  
  const { data: posts, error } = await supabase
    .from('posts')
    .select('*')
    .eq('published', true)
    .order('created_at', { ascending: false })
    .limit(1);

  if (error || !posts?.length) {
    console.error('Error fetching posts:', error?.message);
    console.log('Using fallback data...');
  }

  const post = (posts?.[0] as PostRecord) || {
    title: 'Why Your EV Shows 300km at Night — But Only 190km by Morning',
    slug: 'ev-range-night-vs-morning',
    excerpt: 'Your battery chemistry slows down in the cold. Internal resistance spikes. And cabin heating quietly drains your pack — before you have even left the driveway.',
    reading_time: 7,
    category: 'Deepdive',
    created_at: '2026-04-01',
    author: 'Chaitanya, EV Battery Engineer'
  };

  const issueNumber = getIssueNumber();
  const now = new Date();
  const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  const monthYear = `${months[now.getMonth()]} ${now.getFullYear()}`;

  const articleUrl = `https://evpulse.co.in/blog/${post.slug}`;
  const author = post.author || 'EVPulse Team';
  const readTime = post.reading_time || 5;
  const tag = post.category || 'Deepdive';
  const title = post.title;
  const excerpt = post.excerpt || extractTextContent(post.content?.substring(0, 500) || '');

  const sections = [
    { heading: "The Battery's Chemistry Slows Down", body: "At night, ambient temperature drops. Inside your lithium-ion pack, the electrochemical reactions that release energy slow significantly. The BMS reads this as lower available capacity — even though the cells haven't discharged." },
    { heading: "Internal Resistance Spikes", body: "Cold cells have higher internal resistance. More energy is lost as heat inside the battery during discharge — less reaches the motor. The BMS compensates by reporting a lower usable range." },
    { heading: "Cabin Heating Costs You More Than You Think", body: "Unlike ICE vehicles that recycle engine heat, EVs must generate cabin warmth electrically. Resistance heaters draw 5–7 kW continuously — that's like running your motor at city speeds just to stay comfortable." }
  ];

  const stats = [
    { value: '–35%', label: 'Range loss at 0°C vs 25°C' },
    { value: '2–3×', label: 'Internal resistance increase in cold' },
    { value: '5–7 kW', label: 'Cabin heater draw (resistance type)' }
  ];

  const pullQuote = "The battery's chemistry slows down. Internal resistance spikes. And cabin heating quietly drains your pack — before you have even left the driveway.";

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <meta name="format-detection" content="telephone=no">
  <title>EVPulse – ${issueNumber} | ${escapeHtml(title)}</title>
  <!--[if mso]>
  <noscript>
    <xml>
      <o:OfficeDocumentSettings>
        <o:PixelsPerInch>96</o:PixelsPerInch>
      </o:OfficeDocumentSettings>
    </xml>
  </noscript>
  <![endif]-->
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body, table, td, p, a, li, blockquote {
      -webkit-text-size-adjust: 100%;
      -ms-text-size-adjust: 100%;
    }
    table, td { mso-table-lspace: 0pt; mso-table-rspace: 0pt; border-collapse: collapse; }
    img { border: 0; outline: none; text-decoration: none; -ms-interpolation-mode: bicubic; display: block; }
    a { color: inherit; }
    :root {
      --green-900: #14532D;
      --green-800: #166534;
      --green-700: #15803D;
      --green-600: #16A34A;
      --green-400: #4ADE80;
      --green-200: #BBF7D0;
      --green-100: #DCFCE7;
      --green-50:  #F0FDF4;
      --cream:     #FAFAF7;
      --text-dark: #1A2E1A;
      --text-mid:  #374151;
      --text-muted:#6B7280;
      --divider:   #D1FAE5;
    }
    body {
      background-color: #E8F5E9;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif;
      color: #374151;
    }
    .email-wrapper {
      width: 100%;
      background-color: #E8F5E9;
      padding: 24px 0 40px;
    }
    .email-container {
      max-width: 600px;
      margin: 0 auto;
      background-color: #FAFAF7;
      border-radius: 12px;
      overflow: hidden;
      box-shadow: 0 4px 24px rgba(22, 101, 52, 0.10);
    }
    .header {
      background-color: #166534;
      padding: 0;
      text-align: center;
    }
    .header-top-stripe {
      background-color: #4ADE80;
      height: 3px;
    }
    .header-inner {
      padding: 22px 32px 18px;
    }
    .header-logo {
      font-family: Georgia, 'Times New Roman', serif;
      font-size: 32px;
      font-weight: bold;
      color: #FFFFFF;
      letter-spacing: -1px;
      text-decoration: none;
      display: inline-block;
      line-height: 1;
    }
    .header-logo span { color: #4ADE80; }
    .header-tagline {
      font-size: 10px;
      letter-spacing: 2.5px;
      color: #86EFAC;
      text-transform: uppercase;
      margin-top: 6px;
    }
    .header-meta {
      margin-top: 12px;
      border-top: 1px solid rgba(74, 222, 128, 0.25);
      padding-top: 10px;
      display: flex;
      justify-content: center;
      gap: 24px;
      flex-wrap: wrap;
    }
    .header-meta a {
      font-size: 11px;
      color: #86EFAC;
      text-decoration: none;
      letter-spacing: 0.5px;
    }
    .header-meta a:hover { color: #FFFFFF; }
    .intro-banner {
      background-color: #DCFCE7;
      border-left: 4px solid #16A34A;
      margin: 24px 28px 0;
      border-radius: 0 8px 8px 0;
      padding: 12px 16px;
    }
    .intro-banner-title {
      font-size: 12px;
      font-weight: 600;
      color: #166534;
      letter-spacing: 0.5px;
      text-transform: uppercase;
    }
    .intro-banner-text {
      font-size: 14px;
      color: #374151;
      margin-top: 3px;
      line-height: 1.5;
    }
    .intro-banner-text em {
      color: #16A34A;
      font-style: italic;
    }
    .article-section {
      padding: 24px 28px 0;
    }
    .article-tag {
      display: inline-block;
      background-color: #DCFCE7;
      color: #166534;
      font-size: 10px;
      font-weight: 700;
      letter-spacing: 1.5px;
      text-transform: uppercase;
      padding: 4px 10px;
      border-radius: 4px;
    }
    .article-headline {
      font-family: Georgia, 'Times New Roman', serif;
      font-size: 26px;
      font-weight: bold;
      color: #14532D;
      line-height: 1.25;
      margin-top: 12px;
      letter-spacing: -0.3px;
    }
    .article-headline .accent { color: #16A34A; }
    .article-meta {
      font-size: 11px;
      color: #9CA3AF;
      margin-top: 8px;
      letter-spacing: 0.5px;
    }
    .article-divider {
      border: none;
      border-top: 1px solid #D1FAE5;
      margin: 16px 0;
    }
    .article-intro {
      font-size: 15px;
      line-height: 1.7;
      color: #374151;
    }
    .article-intro strong { color: #14532D; }
    .pull-quote {
      background-color: #F0FDF4;
      border-left: 4px solid #16A34A;
      border-radius: 0 8px 8px 0;
      padding: 14px 18px;
      margin: 20px 0;
    }
    .pull-quote-text {
      font-family: Georgia, 'Times New Roman', serif;
      font-size: 16px;
      font-style: italic;
      color: #14532D;
      line-height: 1.6;
    }
    .pull-quote-attr {
      font-size: 11px;
      color: #6B7280;
      margin-top: 8px;
    }
    .section-block {
      margin: 20px 0;
    }
    .section-heading {
      font-family: Georgia, 'Times New Roman', serif;
      font-size: 17px;
      font-weight: bold;
      color: #14532D;
      margin-bottom: 8px;
      padding-bottom: 6px;
      border-bottom: 2px solid #DCFCE7;
    }
    .section-heading .num {
      color: #16A34A;
      margin-right: 4px;
    }
    .body-text {
      font-size: 15px;
      line-height: 1.75;
      color: #374151;
    }
    .stats-row {
      display: flex;
      gap: 12px;
      margin: 20px 0;
    }
    .stat-card {
      flex: 1;
      background-color: #F0FDF4;
      border: 1px solid #BBF7D0;
      border-radius: 8px;
      padding: 14px 12px;
      text-align: center;
    }
    .stat-value {
      font-size: 22px;
      font-weight: 700;
      color: #166534;
      line-height: 1;
    }
    .stat-label {
      font-size: 10px;
      color: #6B7280;
      margin-top: 4px;
      letter-spacing: 0.3px;
      line-height: 1.3;
    }
    .cta-wrap {
      text-align: center;
      margin: 28px 0 8px;
    }
    .cta-btn {
      display: inline-block;
      background-color: #166534;
      color: #FFFFFF !important;
      font-size: 14px;
      font-weight: 700;
      letter-spacing: 0.5px;
      text-decoration: none;
      padding: 14px 32px;
      border-radius: 6px;
      border: 2px solid #166534;
    }
    .cta-btn:hover {
      background-color: #14532D;
      border-color: #14532D;
    }
    .cta-secondary {
      display: inline-block;
      margin-top: 10px;
      font-size: 13px;
      color: #16A34A;
      text-decoration: underline;
    }
    .footer {
      background-color: #166534;
      padding: 24px 28px;
      margin-top: 28px;
    }
    .footer-logo {
      font-family: Georgia, 'Times New Roman', serif;
      font-size: 20px;
      font-weight: bold;
      color: #FFFFFF;
      text-decoration: none;
    }
    .footer-logo span { color: #4ADE80; }
    .footer-tagline {
      font-size: 11px;
      color: #86EFAC;
      margin-top: 4px;
    }
    .footer-links {
      margin-top: 16px;
      border-top: 1px solid rgba(74, 222, 128, 0.2);
      padding-top: 14px;
      display: flex;
      gap: 20px;
      flex-wrap: wrap;
    }
    .footer-links a {
      font-size: 11px;
      color: #86EFAC;
      text-decoration: none;
    }
    .footer-legal {
      font-size: 10px;
      color: rgba(134, 239, 172, 0.6);
      margin-top: 14px;
      line-height: 1.6;
    }
    .footer-legal a {
      color: rgba(134, 239, 172, 0.8);
      text-decoration: underline;
    }
    @media screen and (max-width: 640px) {
      .email-wrapper { padding: 0 !important; }
      .email-container { border-radius: 0 !important; box-shadow: none !important; }
      .header-inner { padding: 18px 20px 14px !important; }
      .header-logo { font-size: 26px !important; }
      .intro-banner { margin: 16px 16px 0 !important; }
      .article-section { padding: 18px 16px 0 !important; }
      .article-headline { font-size: 22px !important; }
      .stats-row { flex-direction: column !important; }
      .stat-card { flex: none !important; }
      .footer { padding: 20px 16px !important; }
      .footer-links { gap: 12px !important; }
      .cta-btn { display: block !important; text-align: center !important; padding: 14px 20px !important; }
    }
  </style>
</head>
<body>

<div class="email-wrapper">
<div class="email-container">

  <div class="header">
    <div class="header-top-stripe"></div>
    <div class="header-inner">
      <a href="https://evpulse.co.in" class="header-logo">EV<span>Pulse</span></a>
      <p class="header-tagline">Engineering Clarity for the EV Era</p>
      <div class="header-meta">
        <a href="https://evpulse.co.in/category/cell-chemistry">Battery Status</a>
        <a href="https://evpulse.co.in/category/news">Charging</a>
        <a href="https://evpulse.co.in/category/standards">Policy</a>
        <a href="https://evpulse.co.in/calculators">Tools</a>
      </div>
    </div>
  </div>

  <div class="intro-banner">
    <div class="intro-banner-title">${issueNumber} · ${monthYear}</div>
    <div class="intro-banner-text">
      ${escapeHtml(excerpt.substring(0, 120))}...
      <em>Stick around for stats that might surprise you.</em>
    </div>
  </div>

  <div class="article-section">

    <span class="article-tag">${escapeHtml(tag)}</span>

    <h1 class="article-headline">
      ${escapeHtml(title)}
    </h1>

    <p class="article-meta">${readTime} MIN READ &nbsp;·&nbsp; BY ${escapeHtml(author)}</p>

    <hr class="article-divider">

    <p class="article-intro">
      Hey — thanks for being part of EVPulse. ${escapeHtml(excerpt.substring(0, 200))}...
    </p>

    <div class="pull-quote">
      <p class="pull-quote-text">"${escapeHtml(pullQuote)}"</p>
      <p class="pull-quote-attr">— ${escapeHtml(author)}</p>
    </div>

    ${sections.map((s, i) => `
    <div class="section-block">
      <h2 class="section-heading"><span class="num">0${i + 1}/</span> ${escapeHtml(s.heading)}</h2>
      <p class="body-text">${escapeHtml(s.body)}</p>
    </div>
    `).join('')}

    <div class="stats-row">
      ${stats.map(s => `
      <div class="stat-card">
        <div class="stat-value">${escapeHtml(s.value)}</div>
        <div class="stat-label">${escapeHtml(s.label)}</div>
      </div>
      `).join('')}
    </div>

    <div class="cta-wrap">
      <a href="${articleUrl}" class="cta-btn">
        Read Full Article →
      </a>
      <br>
      <a href="https://evpulse.co.in/blogs" class="cta-secondary">Browse all articles</a>
    </div>

  </div>

  <div class="footer">
    <a href="https://evpulse.co.in" class="footer-logo">EV<span>Pulse</span></a>
    <p class="footer-tagline">Engineering clarity for the EV era · evpulse.co.in</p>
    <div class="footer-links">
      <a href="https://evpulse.co.in">Website</a>
      <a href="https://evpulse.co.in/blogs">Articles</a>
      <a href="https://evpulse.co.in/calculators">Tools</a>
      <a href="https://evpulse.co.in/category/standards">Policy</a>
      <a href="mailto:hello@evpulse.co.in">Contact</a>
    </div>
    <p class="footer-legal">
      You're receiving this because you subscribed at evpulse.co.in.<br>
      <a href="{{ unsubscribe }}">Unsubscribe</a> &nbsp;·&nbsp;
      <a href="https://evpulse.co.in/privacy">Privacy Policy</a> &nbsp;·&nbsp;
      © 2026 EVPulse. All rights reserved.
    </p>
  </div>

</div>
</div>

</body>
</html>`;

  fs.writeFileSync('evpulse-newsletter.html', html);
  console.log('✅ Newsletter generated: evpulse-newsletter.html');
  console.log(`\n📰 Issue: ${issueNumber}`);
  console.log(`📝 Title: ${title}`);
  console.log(`⏱️ Read time: ${readTime} min`);
  console.log(`🏷️ Category: ${tag}`);
  console.log(`🔗 URL: ${articleUrl}`);
  console.log('\n📋 Next steps:');
  console.log('1. Open evpulse-newsletter.html in your browser');
  console.log('2. Copy the HTML content');
  console.log('3. Paste into Brevo email template editor');
  console.log('4. Send to your subscribers!\n');
}

generateNewsletter().catch(console.error);