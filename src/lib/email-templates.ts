/**
 * Modern, visually rich, branded email templates for PET BASE.
 *
 * DESIGN: Card-in-card layout inspired by professional email templates.
 * — Outer card: 28px border-radius, 1px border, white bg
 * — Header: teal gradient with paw logo
 * — Body: white with content
 * — Dark CTA footer: teal with white pill button
 *
 * COLOURS: teal primary (#0d9488) + pink/magenta accent (#e01253).
 * FONT: Nunito via Google Fonts @import.
 */

const PRIMARY = "#0d9488";
const PRIMARY_DARK = "#0a6e66";
const ACCENT = "#e01253";
const ACCENT_PURPLE = "#7C5CBF";
const ACCENT_ORANGE = "#F59E0B";
const ACCENT_RED = "#DC2626";
const ACCENT_GREEN = "#0d9488";
const BG_OUTER = "#f7f8fb";
const CARD_BORDER = "#eef0f6";
const TEXT_DARK = "#333333";
const TEXT_MUTED = "#6b7280";
const ON_DARK = TEXT_DARK;
const ON_DARK_MUTED = TEXT_MUTED;
const ON_DARK_BORDER = CARD_BORDER;
const FONT = "'Nunito','Helvetica Neue',-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Arial,sans-serif";

// Aliases for backward compat with existing template code
const BRAND = PRIMARY;
const BRAND_DARK = PRIMARY_DARK;
const BRAND_LIGHT = PRIMARY;
const HEADER_BG = PRIMARY;

function escapeHtml(t: string): string {
  return String(t ?? "").replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;").replace(/'/g,"&#039;");
}

/** Single paw — 1 heart-shaped heel + 3 toes, hollow white outlines, tilted 20° right. */
const PAW = (size = 20, color = "#fff") =>
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 110" style="width:${size}px;height:${size}px;transform:rotate(45deg);vertical-align:middle;">` +
  `<path d="M50 48 C30 40 12 62 14 84 C14 100 26 110 38 102 C44 98 47 92 50 86 C53 92 56 98 62 102 C74 110 86 100 86 84 C88 62 70 40 50 48 Z" fill="none" stroke="${color}" stroke-width="10" stroke-linejoin="round" stroke-linecap="round"/>` +
  `<circle cx="16" cy="22" r="10" fill="none" stroke="${color}" stroke-width="10"/>` +
  `<circle cx="50" cy="14" r="10" fill="none" stroke="${color}" stroke-width="10"/>` +
  `<circle cx="84" cy="22" r="10" fill="none" stroke="${color}" stroke-width="10"/>` +
  `</svg>`;

/** Hero image URL. */
const heroImg = (id: string, h = 200) => `https://images.unsplash.com/${id}?w=560&h=${h}&fit=crop&q=70`;

// ═══════════════════════════════════════════════════════════════
//  SHARED BASE WRAPPER
// ═══════════════════════════════════════════════════════════════
export function buildEmailHtml({
  title, bodyHtml, preheader,
}: {
  title: string; bodyHtml: string; preheader?: string;
}): string {
  const legalLinks = ["Terms","Privacy","Acknowledgment"];
  const legalUrls = [
    "https://petbase.app/terms-and-conditions",
    "https://petbase.app/privacy-centre",
    "https://petbase.app/acknowledgment",
  ];
  return `<!DOCTYPE html>
<html lang="en"><head>
<meta charset="utf-8"/><meta name="viewport" content="width=device-width,initial-scale=1.0"/>
<meta name="color-scheme" content="light only"/>
<title>${escapeHtml(title)}</title>
<style>@import url('https://fonts.googleapis.com/css2?family=Nunito:wght@400;600;700;800;900&display=swap');</style>
</head><body style="margin:0;padding:0;background:${BG_OUTER};font-family:${FONT};-webkit-font-smoothing:antialiased;">
${preheader ? `<div style="display:none;max-height:0;overflow:hidden;opacity:0;">${escapeHtml(preheader)}</div>` : ""}
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${BG_OUTER};padding:28px 16px;">
<tr><td align="center">

<!-- ══ Outer Card ══ -->
<table role="presentation" cellpadding="0" cellspacing="0" style="width:592px;max-width:592px;background:#ffffff;border:1px solid ${CARD_BORDER};border-collapse:separate;border-spacing:0;">

<!-- ══ Header ══ -->
<tr><td style="background:${PRIMARY};padding:20px 36px;text-align:center;border-radius:28px 28px 0 0;">
<table role="presentation" cellpadding="0" cellspacing="0" align="center"><tr>
<td style="vertical-align:middle;padding-right:12px;">
<div style="width:40px;height:40px;line-height:40px;text-align:center;background:rgba(255,255,255,0.15);border-radius:50%;">${PAW(20)}</div>
</td><td style="vertical-align:middle;">
<div style="font-size:22px;font-weight:900;color:#fff;letter-spacing:-0.5px;line-height:1;">PET BASE</div>
</td></tr></table>
</td></tr>

<!-- ══ Body ══ -->
<tr><td style="background:#ffffff;padding:36px 36px 28px;border-top:1px solid #f2f3f8;">
${bodyHtml}
</td></tr>

<!-- ══ Dark CTA Section ══ -->
<tr><td style="background:${PRIMARY};padding:22px 36px 24px;border-radius:0 0 28px 28px;">
<div style="text-align:center;font-size:18px;font-weight:800;color:#fff;line-height:1.4;margin-bottom:6px;">Trusted pet care, wherever you are.</div>
<div style="text-align:center;font-size:13px;color:rgba(255,255,255,0.75);line-height:1.6;margin-bottom:16px;">Find vetted sitters, walkers &amp; groomers near you — or list your own services.</div>
<table role="presentation" cellpadding="0" cellspacing="0" align="center"><tr><td style="border-radius:50px;background:#ffffff;">
<a href="https://petbase.app/browse" style="display:inline-block;padding:12px 32px;font-size:14px;font-weight:800;color:${PRIMARY};text-decoration:none;border-radius:50px;font-family:${FONT};">Browse PET BASE</a>
</td></tr></table>
</td></tr>

</table>

<!-- ══ Footer (outside card) ══ -->
<table role="presentation" cellpadding="0" cellspacing="0" style="width:592px;max-width:592px;margin-top:4px;">
<tr><td style="text-align:center;padding:12px 0;">
${PAW(12, TEXT_MUTED)} <span style="font-size:14px;font-weight:900;color:${TEXT_DARK};letter-spacing:-0.3px;vertical-align:middle;">PET BASE</span>
<span style="display:inline-block;margin-left:10px;">
${legalLinks.map((l,i) => `<a href="${legalUrls[i]}" style="color:${TEXT_MUTED};text-decoration:none;font-size:11px;font-weight:600;margin:0 3px;">${l}</a>`).join("")}
</span>
</td></tr>
<tr><td style="text-align:center;font-size:11px;color:${TEXT_MUTED};line-height:1.6;">
10 Rue Thureau Dangin &middot; 75015 Paris &middot; France<br/>
&copy; ${new Date().getFullYear()} PET BASE &middot; <a href="https://petbase.app" style="color:${TEXT_MUTED};text-decoration:none;">petbase.app</a>
</td></tr>
</table>

</td></tr></table>
</body></html>`;
}

/** CTA button — pill-shaped, accent pink. */
function btn(text: string, url: string, color = ACCENT): string {
  return `<table role="presentation" cellpadding="0" cellspacing="0" style="margin:24px auto;"><tr><td style="border-radius:50px;background:${color};text-align:center;">
<a href="${escapeHtml(url)}" style="display:inline-block;padding:13px 36px;font-size:15px;font-weight:800;color:#fff;text-decoration:none;border-radius:50px;font-family:${FONT};">${escapeHtml(text)}</a>
</td></tr></table>`;
}

/** Rounded hero image. */
function hero(id: string, h = 200): string {
  return `<div style="border-radius:14px;overflow:hidden;margin-bottom:24px;"><img src="${heroImg(id,h)}" alt="" style="display:block;width:100%;height:${h}px;object-fit:cover;"/></div>`;
}

/** Cat face — flat modern vector illustration. */
const CAT_FACE = `<path d="M50 70 L38 25 L82 52 Z" fill="#1A1A1A"/><path d="M150 70 L162 25 L118 52 Z" fill="#1A1A1A"/><ellipse cx="100" cy="100" rx="52" ry="48" fill="#1A1A1A"/><path d="M55 65 L48 38 L75 55 Z" fill="#fff" fill-opacity="0.1"/><path d="M145 65 L152 38 L125 55 Z" fill="#fff" fill-opacity="0.1"/><ellipse cx="80" cy="92" rx="6" ry="8" fill="#fff"/><ellipse cx="120" cy="92" rx="6" ry="8" fill="#fff"/><ellipse cx="80" cy="93" rx="2.5" ry="6" fill="#1A1A1A"/><ellipse cx="120" cy="93" rx="2.5" ry="6" fill="#1A1A1A"/><path d="M93 108 L100 115 L107 108 Z" fill="#fff" fill-opacity="0.25"/><path d="M100 115 L100 120 M100 120 Q93 126 88 121 M100 120 Q107 126 112 121" stroke="#fff" stroke-width="2" fill="none" opacity="0.2" stroke-linecap="round"/><line x1="55" y1="105" x2="75" y2="107" stroke="#fff" stroke-width="1.5" opacity="0.12" stroke-linecap="round"/><line x1="55" y1="113" x2="75" y2="112" stroke="#fff" stroke-width="1.5" opacity="0.12" stroke-linecap="round"/><line x1="145" y1="105" x2="125" y2="107" stroke="#fff" stroke-width="1.5" opacity="0.12" stroke-linecap="round"/><line x1="145" y1="113" x2="125" y2="112" stroke="#fff" stroke-width="1.5" opacity="0.12" stroke-linecap="round"/>`;

/** Dog face — flat modern vector illustration. */
const DOG_FACE = `<ellipse cx="52" cy="95" rx="24" ry="40" fill="#1A1A1A" transform="rotate(-10 52 95)"/><ellipse cx="148" cy="95" rx="24" ry="40" fill="#1A1A1A" transform="rotate(10 148 95)"/><ellipse cx="100" cy="95" rx="48" ry="46" fill="#1A1A1A"/><circle cx="80" cy="83" r="6" fill="#fff"/><circle cx="120" cy="83" r="6" fill="#fff"/><ellipse cx="100" cy="115" rx="24" ry="18" fill="#fff" fill-opacity="0.06"/><ellipse cx="100" cy="108" rx="9" ry="7" fill="#fff" fill-opacity="0.2"/><path d="M100 115 L100 125 M100 125 Q92 131 87 125 M100 125 Q108 131 113 125" stroke="#fff" stroke-width="2.5" fill="none" opacity="0.2" stroke-linecap="round"/>`;

/** Modern vector hero banner — stylised animal on decorative background. */
function vectorHero(animal: "cat" | "dog" | "dogcat" = "dog", h = 180): string {
  return imageHero(h);
}

/** Image-based hero banner (branded PET BASE wallpaper). */
function imageHero(h = 180): string {
  return `<div style="border-radius:14px;overflow:hidden;margin-bottom:24px;"><img src="/email-hero.png" alt="PET BASE" style="display:block;width:100%;height:${h}px;object-fit:cover;"/></div>`;
}

/** Wave divider. */
function divider(): string {
  return `<div style="text-align:center;margin:20px 0;"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 12" style="width:120px;height:8px;opacity:0.25;"><path d="M0 6 Q25 0 50 6 T100 6 T150 6 T200 6" fill="none" stroke="${PRIMARY}" stroke-width="2.5" stroke-linecap="round"/></svg></div>`;
}

/** Info card — light background with rounded corners. */
function card(content: string, bg = BG_OUTER): string {
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${bg};border-radius:14px;padding:22px;margin-bottom:20px;"><tr><td style="color:${TEXT_DARK};">${content}</td></tr></table>`;
}

/** Detail row (label left, value right). */
function row(label: string, value: string, bold = false): string {
  return `<tr><td style="font-size:12px;font-weight:800;color:${TEXT_MUTED};text-transform:uppercase;letter-spacing:1px;padding:0 0 4px;">${escapeHtml(label)}</td><td style="font-size:15px;font-weight:${bold ? "800" : "600"};color:${TEXT_DARK};text-align:right;padding:0 0 12px;">${escapeHtml(value)}</td></tr>`;
}

/** Modern circular line-icon badge (monochrome SVG, email-safe). */
function icon(paths: string, tint = PRIMARY): string {
  return `<div style="width:52px;height:52px;line-height:52px;text-align:center;background:${tint}15;border-radius:50%;margin:0 auto 10px;"><svg xmlns="http://www.w3.org/2000/svg" width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="${tint}" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align:middle;">${paths}</svg></div>`;
}

/** Inline mini SVG icon (for badges / inline use). */
function miniIcon(paths: string, tint = TEXT_DARK, size = 13): string {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="${tint}" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="vertical-align:middle;margin-right:4px;">${paths}</svg>`;
}

/** Feature tile for the welcome grid (consistent rounded rectangle + line icon). */
function featureTile(svgPaths: string, title: string, subtitle: string): string {
  return `<td style="width:50%;padding:6px;"><div style="background:${PRIMARY}06;border:1px solid ${CARD_BORDER};border-radius:14px;padding:22px 14px;text-align:center;"><div style="margin-bottom:10px;"><svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="${PRIMARY}" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">${svgPaths}</svg></div><div style="font-size:13px;font-weight:800;color:${TEXT_DARK};">${escapeHtml(title)}</div><div style="font-size:11px;color:${TEXT_MUTED};margin-top:3px;">${escapeHtml(subtitle)}</div></div></td>`;
}

// ═══════════════════════════════════════════════════════════════
//  TEMPLATE BUILDERS
// ═══════════════════════════════════════════════════════════════

// 1. Welcome
export function buildWelcomeEmailHtml({ firstName }: { firstName: string }): string {
  const body = `
    <h1 style="font-size:26px;font-weight:900;color:${TEXT_DARK};margin:0 0 10px;line-height:1.2;">Welcome to PET&nbsp;BASE, ${escapeHtml(firstName)}! &#127881;</h1>
    <p style="font-size:16px;color:${TEXT_MUTED};margin:0 0 28px;line-height:1.7;">You've joined thousands of pet lovers. Find trusted sitters, dog walkers, groomers &amp; vets &mdash; or list your own services.</p>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:8px;"><tr>
      ${featureTile(`<circle cx="11" cy="11" r="7"/><line x1="16.5" y1="16.5" x2="21" y2="21"/>`,"Browse Services","Find providers near you")}
      ${featureTile(`<path d="M12 2 4 5v6c0 5 3.5 8.5 8 11 4.5-2.5 8-6 8-11V5l-8-3z"/><polyline points="9 12 11 14 15 10"/>`,"Verified","Background-checked")}
    </tr></table>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:24px;"><tr>
      ${featureTile(`<line x1="19" y1="5" x2="5" y2="19"/><circle cx="6.5" cy="6.5" r="2.5"/><circle cx="17.5" cy="17.5" r="2.5"/>`,"Keep 82%","Of every booking")}
      ${featureTile(`<path d="M21 11.5a8.38 8.38 0 0 1-8.5 8.5 8.5 8.5 0 0 1-3.8-.9L3 21l1.9-5.7a8.5 8.5 0 0 1-.9-3.8 8.38 8.38 0 0 1 8.5-8.5 8.38 8.38 0 0 1 8.5 8.5z"/>`,"Chat Directly","Message providers")}
    </tr></table>
    ${btn("Explore PET BASE","https://petbase.app/browse")}
    <p style="font-size:14px;color:${TEXT_MUTED};text-align:center;margin:0;"><a href="https://petbase.app/dashboard" style="color:${BRAND};font-weight:600;text-decoration:none;">Set up your profile</a> &middot; <a href="https://petbase.app/contact-us" style="color:${BRAND};font-weight:600;text-decoration:none;">Need help?</a></p>`;
  return buildEmailHtml({ title:"Welcome to PET BASE!", bodyHtml: body, preheader:"You're all set — start exploring trusted pet care near you." });
}

// 2. Contact admin
export function buildContactEmailHtml({ firstName,lastName,email,town,country,phone,subject,message,attachmentUrls }: {
  firstName:string; lastName:string; email:string; town?:string|null; country?:string|null; phone?:string|null; subject:string; message:string; attachmentUrls:string[];
}): string {
  const body = `
    <div style="border-left:4px solid ${BRAND};padding-left:14px;margin-bottom:24px;">
      <div style="font-size:11px;font-weight:800;color:${BRAND};text-transform:uppercase;letter-spacing:1.5px;margin-bottom:4px;">&#9993; Contact Form</div>
      <h1 style="font-size:22px;font-weight:900;color:${TEXT_DARK};margin:0;">${escapeHtml(subject)}</h1>
    </div>
    ${card(`<table role="presentation" width="100%" cellpadding="0" cellspacing="0">
      ${row("From",`${escapeHtml(firstName)} ${escapeHtml(lastName)}`)}
      ${row("Email",email)}
      ${phone ? row("Phone",phone) : ""}
      ${town||country ? row("Location",`${escapeHtml(town||"")}${town&&country?", ":""}${escapeHtml(country||"")}`) : ""}
    </table>`)}
    <div style="font-size:11px;font-weight:800;color:${TEXT_MUTED};text-transform:uppercase;letter-spacing:1.5px;margin-bottom:8px;">Message</div>
    <div style="background:${BG_OUTER};border-radius:14px;padding:20px;font-size:14px;color:${TEXT_DARK};line-height:1.7;white-space:pre-wrap;margin-bottom:24px;">${escapeHtml(message)}</div>
    ${attachmentUrls.length ? `<div style="font-size:11px;font-weight:800;color:${TEXT_MUTED};text-transform:uppercase;letter-spacing:1.5px;margin-bottom:8px;">Attachments (${attachmentUrls.length})</div><ul style="padding:0;list-style:none;margin:0 0 16px;">${attachmentUrls.map(u=>`<li style="padding:4px 0;font-size:13px;"><a href="${escapeHtml(u)}" style="color:${BRAND};text-decoration:none;">&#128206; ${escapeHtml(u.split("/").pop()||u)}</a></li>`).join("")}</ul>`:""}`;
  return buildEmailHtml({ title:`Contact: ${subject}`, bodyHtml: body, preheader:`New contact form submission from ${firstName} ${lastName}` });
}

// 3. Contact auto-reply
export function buildContactConfirmationEmailHtml({ firstName,subject,message }: { firstName:string; subject:string; message:string }): string {
  const body = `
    <h1 style="font-size:24px;font-weight:900;color:${TEXT_DARK};margin:0 0 8px;line-height:1.2;">Thanks, ${escapeHtml(firstName)}! &#128075;</h1>
    <p style="font-size:16px;color:${TEXT_MUTED};margin:0 0 28px;line-height:1.7;">We've received your message and will respond within <strong style="color:${BRAND};">1&ndash;2 business days</strong>.</p>
    ${card(`<table role="presentation" width="100%" cellpadding="0" cellspacing="0">${row("Regarding",subject,true)}<tr><td colspan="2" style="padding:10px 0 0;font-size:11px;font-weight:800;color:${ON_DARK_MUTED};text-transform:uppercase;letter-spacing:1px;">Your message</td></tr><tr><td colspan="2" style="font-size:14px;color:${ON_DARK};line-height:1.7;white-space:pre-wrap;padding-top:6px;">${escapeHtml(message)}</td></tr></table>`)}
    ${btn("Visit PET BASE","https://petbase.app")}
    <p style="font-size:14px;color:${TEXT_MUTED};text-align:center;margin:0;"><a href="https://petbase.app/browse" style="color:${BRAND};font-weight:600;text-decoration:none;">Browse services</a> in the meantime</p>`;
  return buildEmailHtml({ title:"We received your message — PET BASE", bodyHtml: body, preheader:"Thanks for reaching out — we'll reply within 1-2 business days." });
}

// 4. Support handoff
export function buildSupportEmailHtml({ name,email,message,transcript }: { name:string; email:string; message:string; transcript?:{role:string;content:string}[] }): string {
  const body = `
    <div style="border-left:4px solid ${ACCENT_PURPLE};padding-left:14px;margin-bottom:24px;">
      <div style="font-size:11px;font-weight:800;color:${ACCENT_PURPLE};text-transform:uppercase;letter-spacing:1.5px;margin-bottom:4px;">&#128172; Support Handoff</div>
      <h1 style="font-size:22px;font-weight:900;color:${TEXT_DARK};margin:0;">New Support Request</h1>
    </div>
    ${card(`<table role="presentation" width="100%" cellpadding="0" cellspacing="0">${row("From",name)}${row("Email",email)}</table>`)}
    <div style="font-size:11px;font-weight:800;color:${TEXT_MUTED};text-transform:uppercase;letter-spacing:1.5px;margin-bottom:8px;">Message</div>
    <div style="background:${BG_OUTER};border-radius:14px;padding:20px;font-size:14px;color:${TEXT_DARK};line-height:1.7;white-space:pre-wrap;margin-bottom:24px;">${escapeHtml(message)}</div>
    ${transcript?.length ? `<div style="font-size:11px;font-weight:800;color:${TEXT_MUTED};text-transform:uppercase;letter-spacing:1.5px;margin-bottom:10px;">Chat Transcript</div><table role="presentation" width="100%" cellpadding="0" cellspacing="0">${transcript.map(m=>`<tr><td style="padding:8px 14px;font-size:13px;color:${TEXT_DARK};line-height:1.5;background:${m.role==="user"?"#eef5f4":"#F8F9FA"};border-radius:10px;margin-bottom:4px;"><strong style="color:${TEXT_MUTED};">${escapeHtml(m.role)}:</strong> ${escapeHtml(m.content)}</td></tr><tr><td style="height:4px;"></td></tr>`).join("")}</table>`:""}`;
  return buildEmailHtml({ title:"Support request — PET BASE", bodyHtml: body, preheader:"A user requested human support via the chat widget." });
}

// 5. Booking sent (to owner)
export function buildBookingSentEmailHtml({ customerName,providerName,serviceType,startDate,totalPrice }: { customerName:string; providerName:string; serviceType:string; startDate:string; totalPrice:string }): string {
  const body = `
    <div style="text-align:center;margin-bottom:28px;">${icon(`<polyline points="20 6 9 17 4 12"/>`)}
    <h1 style="font-size:24px;font-weight:900;color:${TEXT_DARK};margin:0 0 6px;">Booking request sent!</h1>
    <p style="font-size:15px;color:${TEXT_MUTED};margin:0;">Hi ${escapeHtml(customerName)}, your request is with <strong style="color:${TEXT_DARK};">${escapeHtml(providerName)}</strong>.</p></div>
    ${card(`<table role="presentation" width="100%" cellpadding="0" cellspacing="0">${row("Service",serviceType,true)}${row("Provider",providerName)}${row("When",startDate)}<tr><td style="font-size:12px;font-weight:800;color:${ON_DARK_MUTED};text-transform:uppercase;letter-spacing:1px;border-top:1px solid ${ON_DARK_BORDER};padding-top:12px;">Total</td><td style="font-size:22px;font-weight:900;color:${ON_DARK};text-align:right;border-top:1px solid ${ON_DARK_BORDER};padding-top:12px;">${escapeHtml(totalPrice)}</td></tr><tr><td colspan="2" style="padding-top:12px;text-align:center;"><span style="font-size:12px;font-weight:700;color:${ACCENT_ORANGE};background:${ACCENT_ORANGE}15;padding:5px 14px;border-radius:20px;">${miniIcon(`<circle cx="12" cy="12" r="9"/><polyline points="12 7 12 12 15 14"/>`,ACCENT_ORANGE)}Pending confirmation</span></td></tr></table>`)}
    ${btn("View My Bookings","https://petbase.app/bookings")}
    <p style="font-size:13px;color:${TEXT_MUTED};text-align:center;margin:0;">You won't be charged until ${escapeHtml(providerName)} confirms.</p>`;
  return buildEmailHtml({ title:"Booking request sent — PET BASE", bodyHtml: body, preheader:`Your booking with ${providerName} has been sent.` });
}

// 6. Booking received (to provider)
export function buildBookingReceivedEmailHtml({ providerName,customerName,serviceType,startDate,totalPrice }: { providerName:string; customerName:string; serviceType:string; startDate:string; totalPrice:string }): string {
  const body = `
    <div style="text-align:center;margin-bottom:28px;">${icon(`<path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"/>`,ACCENT_ORANGE)}
    <h1 style="font-size:24px;font-weight:900;color:${TEXT_DARK};margin:0 0 6px;">New booking request!</h1>
    <p style="font-size:15px;color:${TEXT_MUTED};margin:0;">Hi ${escapeHtml(providerName)}, <strong style="color:${TEXT_DARK};">${escapeHtml(customerName)}</strong> wants to book your service.</p></div>
    ${card(`<table role="presentation" width="100%" cellpadding="0" cellspacing="0">${row("Service",serviceType,true)}${row("Customer",customerName)}${row("When",startDate)}<tr><td style="font-size:12px;font-weight:800;color:${ON_DARK_MUTED};text-transform:uppercase;letter-spacing:1px;border-top:1px solid ${ON_DARK_BORDER};padding-top:12px;">Payout</td><td style="font-size:22px;font-weight:900;color:${ON_DARK};text-align:right;border-top:1px solid ${ON_DARK_BORDER};padding-top:12px;">${escapeHtml(totalPrice)}</td></tr></table>`)}
    ${btn("Review Booking","https://petbase.app/bookings",ACCENT_ORANGE)}
    <p style="font-size:13px;color:${TEXT_MUTED};text-align:center;margin:0;">Please accept or decline within 24 hours.</p>`;
  return buildEmailHtml({ title:"New booking request — PET BASE", bodyHtml: body, preheader:`${customerName} wants to book your ${serviceType}.` });
}

// 7. Booking confirmed
export function buildBookingConfirmedEmailHtml({ customerName,providerName,serviceType,startDate,totalPrice }: { customerName:string; providerName:string; serviceType:string; startDate:string; totalPrice:string }): string {
  const body = `
    <div style="text-align:center;margin-bottom:28px;">${icon(`<polyline points="20 6 9 17 4 12"/>`)}
    <h1 style="font-size:24px;font-weight:900;color:${TEXT_DARK};margin:0 0 6px;">Booking confirmed!</h1>
    <p style="font-size:15px;color:${TEXT_MUTED};margin:0;">Great news, ${escapeHtml(customerName)}! <strong style="color:${TEXT_DARK};">${escapeHtml(providerName)}</strong> accepted your booking.</p></div>
    ${card(`<table role="presentation" width="100%" cellpadding="0" cellspacing="0">${row("Service",serviceType,true)}${row("Provider",providerName)}${row("When",startDate)}${row("Total",totalPrice)}<tr><td colspan="2" style="padding-top:12px;text-align:center;"><span style="font-size:12px;font-weight:700;color:${PRIMARY};background:${PRIMARY}15;border:1px solid ${PRIMARY}30;padding:5px 14px;border-radius:20px;">${miniIcon(`<polyline points="20 6 9 17 4 12"/>`,PRIMARY)}Confirmed</span></td></tr></table>`)}
    ${btn("View Booking","https://petbase.app/bookings")}
    <p style="font-size:13px;color:${TEXT_MUTED};text-align:center;margin:0;"><a href="https://petbase.app/messages" style="color:${BRAND};font-weight:600;text-decoration:none;">Message ${escapeHtml(providerName)}</a></p>`;
  return buildEmailHtml({ title:"Booking confirmed — PET BASE", bodyHtml: body, preheader:`${providerName} confirmed your booking!` });
}

// 8. Booking declined/cancelled
export function buildBookingDeclinedEmailHtml({ customerName,providerName,serviceType,startDate,reason }: { customerName:string; providerName:string; serviceType:string; startDate:string; reason?:string }): string {
  const body = `
    <div style="text-align:center;margin-bottom:28px;"><div style="width:52px;height:52px;line-height:52px;text-align:center;background:${ACCENT_RED}15;border-radius:50%;font-size:26px;margin:0 auto 10px;">&#10060;</div>
    <h1 style="font-size:24px;font-weight:900;color:${TEXT_DARK};margin:0 0 6px;">Booking unavailable</h1>
    <p style="font-size:15px;color:${TEXT_MUTED};margin:0;">Hi ${escapeHtml(customerName)}, unfortunately <strong style="color:${TEXT_DARK};">${escapeHtml(providerName)}</strong> couldn't accept your booking.</p></div>
    ${card(`<table role="presentation" width="100%" cellpadding="0" cellspacing="0">${row("Service",serviceType)}${row("Provider",providerName)}${row("When",startDate)}${reason?row("Reason",reason):""}<tr><td colspan="2" style="padding-top:12px;text-align:center;"><span style="font-size:12px;font-weight:700;color:${ACCENT_RED};background:${ACCENT_RED}15;padding:4px 12px;border-radius:20px;">&#10060; Declined</span></td></tr></table>`)}
    <p style="font-size:14px;color:${TEXT_MUTED};text-align:center;margin:0 0 20px;">No charge has been made. Try another provider!</p>
    ${btn("Browse More Services","https://petbase.app/browse")}`;
  return buildEmailHtml({ title:"Booking update — PET BASE", bodyHtml: body, preheader:`Your booking with ${providerName} was declined.` });
}

// 9. Booking completed + receipt
export function buildBookingCompletedEmailHtml({ customerName,providerName,serviceType,startDate,totalPrice,providerNet }: { customerName:string; providerName:string; serviceType:string; startDate:string; totalPrice:string; providerNet?:string }): string {
  const body = `
    <div style="text-align:center;margin-bottom:28px;"><div style="width:52px;height:52px;line-height:52px;text-align:center;background:${ACCENT_GREEN}15;border-radius:50%;font-size:26px;margin:0 auto 10px;">&#127937;</div>
    <h1 style="font-size:24px;font-weight:900;color:${TEXT_DARK};margin:0 0 6px;">Service completed!</h1>
    <p style="font-size:15px;color:${TEXT_MUTED};margin:0;">Your booking with <strong style="color:${TEXT_DARK};">${escapeHtml(providerName)}</strong> is complete. We hope it was paw-some! &#128062;</p></div>
    ${card(`<table role="presentation" width="100%" cellpadding="0" cellspacing="0">${row("Service",serviceType)}${row("Provider",providerName)}${row("Date",startDate)}<tr><td style="font-size:12px;font-weight:800;color:${ON_DARK_MUTED};text-transform:uppercase;letter-spacing:1px;border-top:1px solid ${ON_DARK_BORDER};padding-top:12px;">Total Paid</td><td style="font-size:20px;font-weight:900;color:${ON_DARK};text-align:right;border-top:1px solid ${ON_DARK_BORDER};padding-top:12px;">${escapeHtml(totalPrice)}</td></tr></table>`)}
    <p style="font-size:16px;font-weight:800;color:${TEXT_DARK};text-align:center;margin:0 0 8px;">How was your experience?</p>
    ${btn("Leave a Review","https://petbase.app/bookings")}
    <p style="font-size:14px;color:${TEXT_MUTED};text-align:center;margin:0;"><a href="https://petbase.app/messages" style="color:${BRAND};font-weight:600;text-decoration:none;">Message ${escapeHtml(providerName)}</a> again</p>`;
  return buildEmailHtml({ title:"Service completed — PET BASE", bodyHtml: body, preheader:`Your booking with ${providerName} is complete.` });
}

// 10. New message
export function buildMessageReceivedEmailHtml({ recipientName,senderName,preview }: { recipientName:string; senderName:string; preview:string }): string {
  const body = `
    <div style="background:linear-gradient(135deg,${BRAND},${BRAND_DARK});border-radius:20px;padding:36px 28px;margin:-10px -10px 28px;text-align:center;">
      <div style="width:56px;height:56px;line-height:56px;text-align:center;background:rgba(255,255,255,0.12);border-radius:50%;margin:0 auto 16px;border:1.5px solid rgba(255,255,255,0.15);">${PAW(28)}</div>
      <h1 style="font-size:22px;font-weight:900;color:#fff;margin:0 0 4px;">${escapeHtml(senderName)}</h1>
      <p style="font-size:14px;color:rgba(255,255,255,0.7);margin:0;font-weight:500;">sent you a message</p>
    </div>
    <div style="background:#fff;border:1.5px solid ${BRAND_LIGHT};border-radius:16px;padding:24px 28px;margin-bottom:24px;position:relative;">
      <div style="position:absolute;top:-1px;left:24px;width:40px;height:4px;background:${BRAND};border-radius:0 0 4px 4px;"></div>
      <p style="font-size:15px;color:${TEXT_DARK};line-height:1.8;margin:0;font-weight:500;">${escapeHtml(preview)}</p>
    </div>
    <div style="display:inline-flex;align-items:center;gap:10px;background:${BG_OUTER};border-radius:12px;padding:12px 18px;margin-bottom:20px;">
      <div style="width:32px;height:32px;line-height:32px;text-align:center;background:${PRIMARY};border-radius:50%;font-size:14px;color:#fff;font-weight:800;">${escapeHtml(senderName.charAt(0))}</div>
      <div><div style="font-size:13px;font-weight:800;color:${TEXT_DARK};">${escapeHtml(senderName)}</div><div style="font-size:11px;color:${TEXT_MUTED};">via PET BASE</div></div>
    </div>
    ${btn("Read & Reply","https://petbase.app/messages")}
    <p style="font-size:13px;color:${TEXT_MUTED};text-align:center;margin:12px 0 0;"><a href="https://petbase.app/settings" style="color:${BRAND};font-weight:600;text-decoration:none;">Notification preferences</a></p>`;
  return buildEmailHtml({ title:`${senderName} sent you a message — PET BASE`, bodyHtml: body, preheader:`${senderName}: ${preview.substring(0,80)}...` });
}

// 11. Pet listing published
export function buildPetListingPublishedEmailHtml({ sellerName,petName,species,price,isFree }: { sellerName:string; petName:string; species:string; price:string; isFree:boolean }): string {
  const body = `
    <h1 style="font-size:24px;font-weight:900;color:${TEXT_DARK};margin:0 0 8px;">Your listing is live! &#127881;</h1>
    <p style="font-size:16px;color:${TEXT_MUTED};margin:0 0 28px;">Hi ${escapeHtml(sellerName)}, your pet listing is now visible to buyers on PET BASE.</p>
    ${card(`<table role="presentation" width="100%" cellpadding="0" cellspacing="0">${row("Pet",petName,true)}${row("Type",species)}${row("Price",isFree?"Free (Adoption)":price)}<tr><td colspan="2" style="padding-top:12px;text-align:center;"><span style="font-size:12px;font-weight:700;color:${PRIMARY};background:${PRIMARY}15;border:1px solid ${PRIMARY}30;padding:5px 14px;border-radius:20px;">${miniIcon(`<polyline points="20 6 9 17 4 12"/>`,PRIMARY)}Active</span></td></tr></table>`)}
    ${btn("View My Listings","https://petbase.app/dashboard")}
    <p style="font-size:13px;color:${TEXT_MUTED};text-align:center;margin:0;">You'll be notified when someone makes an offer.</p>`;
  return buildEmailHtml({ title:"Your listing is live — PET BASE", bodyHtml: body, preheader:`${petName} is now visible to buyers.` });
}

// 12. Pet offer received
export function buildPetOfferReceivedEmailHtml({ sellerName,buyerName,petName,offerPrice,message }: { sellerName:string; buyerName:string; petName:string; offerPrice:string; message?:string }): string {
  const body = `
    <div style="text-align:center;margin-bottom:28px;">${icon(`<rect x="2" y="5" width="20" height="14" rx="2"/><line x1="2" y1="10" x2="22" y2="10"/><line x1="6" y1="15" x2="10" y2="15"/>`,ACCENT_ORANGE)}
    <h1 style="font-size:24px;font-weight:900;color:${TEXT_DARK};margin:0 0 6px;">New offer received!</h1>
    <p style="font-size:15px;color:${TEXT_MUTED};margin:0;"><strong style="color:${TEXT_DARK};">${escapeHtml(buyerName)}</strong> made an offer on <strong style="color:${TEXT_DARK};">${escapeHtml(petName)}</strong>.</p></div>
    ${card(`<table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr><td style="font-size:12px;font-weight:800;color:${ON_DARK_MUTED};text-transform:uppercase;letter-spacing:1px;border-top:1px solid ${ON_DARK_BORDER};padding-top:12px;">Offer</td><td style="font-size:24px;font-weight:900;color:${ON_DARK};text-align:right;border-top:1px solid ${ON_DARK_BORDER};padding-top:12px;">${escapeHtml(offerPrice)}</td></tr></table>`)}
    ${message ? `<div style="background:${BG_OUTER};border-radius:14px;padding:18px;font-size:14px;color:${TEXT_DARK};line-height:1.6;margin-bottom:24px;"><strong style="color:${TEXT_MUTED};font-size:12px;text-transform:uppercase;letter-spacing:1px;">Message from ${escapeHtml(buyerName)}:</strong><br/>${escapeHtml(message)}</div>`:""}
    ${btn("Review Offer","https://petbase.app/dashboard",ACCENT_ORANGE)}
    <p style="font-size:13px;color:${TEXT_MUTED};text-align:center;margin:0;">Respond soon to keep the buyer engaged!</p>`;
  return buildEmailHtml({ title:`New offer on ${petName} — PET BASE`, bodyHtml: body, preheader:`${buyerName} offered ${offerPrice} for ${petName}.` });
}

// 13. Photo rejected
export function buildPhotoRejectedEmailHtml({ userName,reason }: { userName:string; reason:string }): string {
  const body = `
    <div style="text-align:center;margin-bottom:28px;">${icon(`<path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z"/><circle cx="12" cy="13" r="3.5"/>`,ACCENT_RED)}
    <h1 style="font-size:22px;font-weight:900;color:${TEXT_DARK};margin:0 0 6px;">Photo update</h1>
    <p style="font-size:15px;color:${TEXT_MUTED};margin:0;">Hi ${escapeHtml(userName)}, your profile photo wasn't approved.</p></div>
    ${card(`<div style="font-size:11px;font-weight:800;color:${ACCENT_RED};text-transform:uppercase;letter-spacing:1.5px;margin-bottom:6px;">Reason</div><div style="font-size:14px;color:${TEXT_DARK};line-height:1.6;">${escapeHtml(reason)}</div>`,"#FEF2F2")}
    <p style="font-size:14px;color:${TEXT_MUTED};margin:0 0 24px;line-height:1.6;">Please upload a new photo that follows our guidelines. Your previous photo or initials will be shown in the meantime.</p>
    ${btn("Upload New Photo","https://petbase.app/settings")}`;
  return buildEmailHtml({ title:"Photo update — PET BASE", bodyHtml: body, preheader:"Your profile photo needs attention." });
}

// 14. Password changed
export function buildPasswordChangedEmailHtml({ userName }: { userName:string }): string {
  const body = `
    <div style="text-align:center;margin-bottom:28px;">${icon(`<path d="M12 2 4 5v6c0 5 3.5 8.5 8 11 4.5-2.5 8-6 8-11V5l-8-3z"/><rect x="9" y="10" width="6" height="5" rx="1"/><path d="M10 10V8a2 2 0 0 1 4 0v2"/>`)}
    <h1 style="font-size:22px;font-weight:900;color:${TEXT_DARK};margin:0 0 6px;">Password changed</h1>
    <p style="font-size:15px;color:${TEXT_MUTED};margin:0;">Hi ${escapeHtml(userName)}, your PET BASE password was successfully updated.</p></div>
    ${card(`<p style="font-size:14px;color:${ON_DARK};line-height:1.7;margin:0;">&#9888;&#65039; <strong>Was this you?</strong> If you didn't change your password, please contact us immediately.</p>`)}
    ${btn("Sign In","https://petbase.app/signin",ACCENT_GREEN)}
    <p style="font-size:13px;color:${TEXT_MUTED};text-align:center;margin:0;"><a href="https://petbase.app/contact-us" style="color:${BRAND};font-weight:600;text-decoration:none;">Didn't do this? Contact us</a></p>`;
  return buildEmailHtml({ title:"Password changed — PET BASE", bodyHtml: body, preheader:"Your PET BASE password was updated." });
}

// 15. Lost pet found
export function buildLostPetFoundEmailHtml({ ownerName, petName, species, breed, lastSeenLocation, lastSeenDate, finderName, finderMessage, photoUrls, adUrl }: {
  ownerName: string; petName: string; species: string; breed?: string | null;
  lastSeenLocation: string; lastSeenDate: string; finderName: string;
  finderMessage: string; photoUrls: string[]; adUrl: string;
}): string {
  const photoGrid = photoUrls.length > 0
    ? `<div style="margin:20px 0;">
        <div style="font-size:12px;font-weight:800;color:${ON_DARK_MUTED};text-transform:uppercase;letter-spacing:1px;margin-bottom:12px;">${miniIcon(`<rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="9" cy="9" r="2"/><path d="M21 15l-5-5L5 21"/>`,ON_DARK_MUTED)}Proof Photos</div>
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr>
        ${photoUrls.slice(0, 3).map((url, i) => `<td style="width:${Math.floor(100 / Math.min(photoUrls.length, 3))}%;padding:4px;"><img src="${escapeHtml(url)}" alt="Proof photo ${i + 1}" style="display:block;width:100%;border-radius:12px;border:1px solid ${ON_DARK_BORDER};"/></td>`).join("")}
        </tr></table>
      </div>`
    : "";
  const body = `
    <div style="text-align:center;margin-bottom:28px;">${icon(`<circle cx="11" cy="4" r="2"/><circle cx="18" cy="8" r="2"/><circle cx="4" cy="8" r="2"/><circle cx="11" cy="14" r="2"/><path d="M11 16a6 6 0 0 0-6 6h12a6 6 0 0 0-6-6z"/>`,ACCENT_GREEN)}
    <h1 style="font-size:26px;font-weight:900;color:${TEXT_DARK};margin:0 0 8px;">Good news about ${escapeHtml(petName)}!</h1>
    <p style="font-size:16px;color:${TEXT_MUTED};margin:0;">Hi ${escapeHtml(ownerName)}, someone reported finding your pet.</p></div>

    ${card(`<table role="presentation" width="100%" cellpadding="0" cellspacing="0">
      ${row("Pet Name", petName, true)}
      ${row("Species", species)}
      ${breed ? row("Breed", breed) : ""}
      ${row("Last Seen", lastSeenLocation)}
      ${row("Date", lastSeenDate)}
    </table>`)}
    ${photoGrid}

    ${card(`<div style="font-size:12px;font-weight:800;color:${ON_DARK_MUTED};text-transform:uppercase;letter-spacing:1px;margin-bottom:8px;">${miniIcon(`<path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>`,ON_DARK_MUTED)}Message from ${escapeHtml(finderName)}</div><div style="font-size:15px;color:${ON_DARK};line-height:1.6;">${escapeHtml(finderMessage)}</div>`, "#E8F5E9")}
    ${btn("View Full Details & Photos", adUrl, ACCENT_GREEN)}
    <p style="font-size:13px;color:${TEXT_MUTED};text-align:center;margin:0;">You can also reply directly to ${escapeHtml(finderName)} from your Messages page.</p>`;
  return buildEmailHtml({ title:`${finderName} found your pet ${petName}! — PET BASE`, bodyHtml: body, preheader:`Good news! Someone found ${petName}.` });
}

// ─────────────────────────────────────────────────────────
//  LOST PET — NEW TEMPLATES
// ─────────────────────────────────────────────────────────

/** Social share button row (email-safe colored circles). */
function socialShareRow(adUrl: string, petName: string): string {
  const shareText = encodeURIComponent(`Help me find my lost pet "${petName}"!`);
  const fb = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(adUrl)}`;
  const xUrl = `https://twitter.com/intent/tweet?url=${encodeURIComponent(adUrl)}&text=${shareText}`;
  const wa = `https://wa.me/?text=${shareText}%20${encodeURIComponent(adUrl)}`;
  const sBtn = (label: string, bg: string, url: string) =>
    `<td style="padding:0 6px;"><a href="${escapeHtml(url)}" style="display:inline-block;width:44px;height:44px;line-height:44px;text-align:center;background:${bg};border-radius:50%;text-decoration:none;font-size:16px;font-weight:900;color:#fff;">${label}</a></td>`;
  return `<table role="presentation" cellpadding="0" cellspacing="0" align="center"><tr>
    ${sBtn("f", "#1877F2", fb)}
    ${sBtn("X", "#000000", xUrl)}
    ${sBtn("W", "#25D366", wa)}
  </tr></table>`;
}

/** Action button row for the ad owner — deep-links to the ad page with ?action=xxx. */
function ownerActionRow(adUrl: string): string {
  const aBtn = (label: string, url: string, bg: string) =>
    `<td style="padding:4px;"><a href="${escapeHtml(url)}" style="display:inline-block;padding:10px 18px;font-size:12px;font-weight:800;color:#fff;text-decoration:none;border-radius:8px;background:${bg};white-space:nowrap;">${escapeHtml(label)}</a></td>`;
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:20px 0;"><tr>
    <td style="text-align:center;">
      <table role="presentation" cellpadding="0" cellspacing="0" align="center" style="margin-bottom:8px;"><tr>
        ${aBtn("Edit Ad", `${adUrl}?action=edit`, "#374151")}
        ${aBtn("Print Flyer", `${adUrl}?action=print`, "#1F2937")}
      </tr></table>
      <table role="presentation" cellpadding="0" cellspacing="0" align="center"><tr>
        ${aBtn("Mark Reunited", `${adUrl}?action=reunited`, "#059669")}
        ${aBtn("Close Ad", `${adUrl}?action=close`, "#DC2626")}
      </tr></table>
    </td>
  </tr></table>`;
}

// 16. Lost pet — Ad published (to owner)
export function buildLostPetPublishedEmailHtml({ ownerName, petName, species, breed, photoUrl, lastSeenLocation, lastSeenDate, rewardAmount, adUrl }: {
  ownerName: string; petName: string; species: string; breed?: string | null;
  photoUrl?: string | null; lastSeenLocation: string; lastSeenDate: string;
  rewardAmount?: string | null; adUrl: string;
}): string {
  const petPhoto = photoUrl
    ? `<div style="border-radius:16px;overflow:hidden;margin-bottom:24px;"><img src="${escapeHtml(photoUrl)}" alt="${escapeHtml(petName)}" style="display:block;width:100%;height:200px;object-fit:cover;"/></div>`
    : "";
  const body = `
    <div style="text-align:center;margin-bottom:28px;">${icon(`<circle cx="11" cy="4" r="2"/><circle cx="18" cy="8" r="2"/><circle cx="4" cy="8" r="2"/><circle cx="11" cy="14" r="2"/><path d="M11 16a6 6 0 0 0-6 6h12a6 6 0 0 0-6-6z"/>`, ACCENT_ORANGE)}
    <h1 style="font-size:26px;font-weight:900;color:${TEXT_DARK};margin:0 0 6px;">Your ad is live!</h1>
    <p style="font-size:15px;color:${TEXT_MUTED};margin:0;">Hi ${escapeHtml(ownerName)}, your lost pet ad for <strong style="color:${TEXT_DARK};">${escapeHtml(petName)}</strong> is now visible to everyone nearby.</p></div>
    ${petPhoto}
    ${card(`<table role="presentation" width="100%" cellpadding="0" cellspacing="0">
      ${row("Pet", petName, true)}
      ${row("Species", species)}
      ${breed ? row("Breed", breed) : ""}
      ${row("Last Seen", lastSeenLocation)}
      ${row("Date", lastSeenDate)}
      ${rewardAmount ? `<tr><td style="font-size:12px;font-weight:800;color:${ON_DARK_MUTED};text-transform:uppercase;letter-spacing:1px;border-top:1px solid ${ON_DARK_BORDER};padding-top:12px;">Reward</td><td style="font-size:20px;font-weight:900;color:${ACCENT_ORANGE};text-align:right;border-top:1px solid ${ON_DARK_BORDER};padding-top:12px;">${escapeHtml(rewardAmount)}</td></tr>` : ""}
    </table>`)}
    <p style="font-size:13px;font-weight:800;color:${TEXT_DARK};text-align:center;margin:0 0 12px;">Quick actions</p>
    ${ownerActionRow(adUrl)}
    <div style="border-top:1px solid ${BRAND}15;padding-top:20px;">
      <p style="font-size:13px;font-weight:800;color:${TEXT_DARK};text-align:center;margin:0 0 14px;">Spread the word</p>
      ${socialShareRow(adUrl, petName)}
    </div>
    <p style="font-size:13px;color:${TEXT_MUTED};text-align:center;margin:16px 0 0;">You'll be notified instantly when someone reports finding ${escapeHtml(petName)}.</p>`;
  return buildEmailHtml({ title:`Your lost pet ad is live — PET BASE`, bodyHtml: body, preheader:`Your ad for ${petName} is now visible. Share it widely!` });
}

// 17. Lost pet — Area alert (to local users)
export function buildLostPetAlertEmailHtml({ userName, ownerName, petName, species, breed, photoUrl, lastSeenLocation, lastSeenDate, rewardAmount, adUrl }: {
  userName: string; ownerName: string; petName: string; species: string; breed?: string | null;
  photoUrl?: string | null; lastSeenLocation: string; lastSeenDate: string;
  rewardAmount?: string | null; adUrl: string;
}): string {
  const petPhoto = photoUrl
    ? `<div style="border-radius:16px;overflow:hidden;margin-bottom:24px;"><img src="${escapeHtml(photoUrl)}" alt="${escapeHtml(petName)}" style="display:block;width:100%;height:220px;object-fit:cover;"/></div>`
    : "";
  const body = `
    <div style="text-align:center;margin-bottom:28px;"><div style="width:52px;height:52px;line-height:52px;text-align:center;background:${ACCENT_RED}15;border-radius:50%;font-size:28px;margin:0 auto 10px;">&#128062;</div>
    <h1 style="font-size:24px;font-weight:900;color:${TEXT_DARK};margin:0 0 6px;">A pet needs your help!</h1>
    <p style="font-size:15px;color:${TEXT_MUTED};margin:0;">Hi ${escapeHtml(userName)}, a pet was reported lost near you.</p></div>
    ${petPhoto}
    ${card(`<table role="presentation" width="100%" cellpadding="0" cellspacing="0">
      ${row("Pet Name", petName, true)}
      ${row("Species", species)}
      ${breed ? row("Breed", breed) : ""}
      ${row("Last Seen", lastSeenLocation)}
      ${row("Date", lastSeenDate)}
      ${rewardAmount ? `<tr><td style="font-size:12px;font-weight:800;color:${ON_DARK_MUTED};text-transform:uppercase;letter-spacing:1px;border-top:1px solid ${ON_DARK_BORDER};padding-top:12px;">Reward</td><td style="font-size:22px;font-weight:900;color:${ACCENT_ORANGE};text-align:right;border-top:1px solid ${ON_DARK_BORDER};padding-top:12px;">${escapeHtml(rewardAmount)}</td></tr>` : ""}
    </table>`)}
    <p style="font-size:15px;color:${TEXT_DARK};text-align:center;margin:0 0 24px;">Have you seen <strong>${escapeHtml(petName)}</strong>? Your report could help bring them home.</p>
    ${btn("I Found This Pet", `${adUrl}?found=1`, ACCENT_RED)}
    <p style="font-size:13px;color:${TEXT_MUTED};text-align:center;margin:0;"><a href="${escapeHtml(adUrl)}" style="color:${BRAND};font-weight:600;text-decoration:none;">View full details</a>${rewardAmount ? ` &middot; Reward available` : ""}</p>`;
  return buildEmailHtml({ title:`Lost pet near you: ${petName} — PET BASE`, bodyHtml: body, preheader:`A ${species} named ${petName} was lost near ${lastSeenLocation}. Can you help?` });
}

// 18. Lost pet — Reunited (to finder who reported)
export function buildLostPetReunitedEmailHtml({ finderName, ownerName, petName, species, rewardAmount, messageUrl }: {
  finderName: string; ownerName: string; petName: string; species: string;
  rewardAmount?: string | null; messageUrl: string;
}): string {
  const body = `
    <div style="text-align:center;margin-bottom:28px;"><div style="width:52px;height:52px;line-height:52px;text-align:center;background:${ACCENT_GREEN}15;border-radius:50%;font-size:28px;margin:0 auto 10px;">&#127881;</div>
    <h1 style="font-size:26px;font-weight:900;color:${TEXT_DARK};margin:0 0 6px;">${escapeHtml(petName)} is home!</h1>
    <p style="font-size:15px;color:${TEXT_MUTED};margin:0;">Hi ${escapeHtml(finderName)}, great news — ${escapeHtml(ownerName)} confirmed that <strong style="color:${TEXT_DARK};">${escapeHtml(petName)}</strong> has been safely reunited with their family.</p></div>
    <p style="font-size:16px;color:${TEXT_DARK};text-align:center;margin:0 0 28px;">Thank you for helping bring a lost pet home. &#128062;&#10084;&#65039;</p>
    ${rewardAmount
      ? card(`<div style="text-align:center;"><div style="font-size:12px;font-weight:800;color:${ON_DARK_MUTED};text-transform:uppercase;letter-spacing:1px;margin-bottom:6px;">Reward</div><div style="font-size:28px;font-weight:900;color:${ACCENT_ORANGE};margin-bottom:8px;">${escapeHtml(rewardAmount)}</div><div style="font-size:14px;color:${ON_DARK};">${escapeHtml(ownerName)} offered a reward for finding ${escapeHtml(petName)}. Contact them to claim it.</div></div>`)
      : card(`<div style="text-align:center;font-size:15px;color:${ON_DARK};line-height:1.6;">${escapeHtml(ownerName)} is incredibly grateful for your help.</div>`)}
    ${btn(rewardAmount ? "Claim Reward" : "Send a Message", messageUrl, ACCENT_GREEN)}
    <p style="font-size:13px;color:${TEXT_MUTED};text-align:center;margin:0;">You can reach ${escapeHtml(ownerName)} directly from your Messages page.</p>`;
  return buildEmailHtml({ title:`${petName} is home! — PET BASE`, bodyHtml: body, preheader:`Great news — ${petName} has been reunited thanks to you!` });
}

// 19. Lost pet — Ad closed (to finders who contacted)
export function buildLostPetClosedEmailHtml({ finderName, petName, status, adUrl }: {
  finderName: string; petName: string; status: "reunited" | "closed"; adUrl: string;
}): string {
  const isReunited = status === "reunited";
  const body = `
    <div style="text-align:center;margin-bottom:28px;">${icon(
      isReunited ? `<polyline points="20 6 9 17 4 12"/>` : `<circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/>`,
      isReunited ? ACCENT_GREEN : TEXT_MUTED,
    )}
    <h1 style="font-size:22px;font-weight:900;color:${TEXT_DARK};margin:0 0 6px;">${isReunited ? "Pet reunited!" : "Ad closed"}</h1>
    <p style="font-size:15px;color:${TEXT_MUTED};margin:0;">Hi ${escapeHtml(finderName)}, the lost pet ad for <strong style="color:${TEXT_DARK};">${escapeHtml(petName)}</strong> has been ${isReunited ? "marked as reunited" : "closed by the owner"}.</p></div>
    <p style="font-size:14px;color:${TEXT_MUTED};text-align:center;margin:0 0 24px;">${isReunited
      ? "Thank you for keeping an eye out and for caring about a pet in need."
      : "Thank you for your interest and for helping look out for this pet."}</p>
    ${btn("Browse Lost Pets", "https://petbase.app/lost-pets", TEXT_MUTED)}`;
  return buildEmailHtml({ title:`Lost pet update: ${petName} — PET BASE`, bodyHtml: body, preheader:`The lost pet ad for ${petName} has been ${isReunited ? "resolved" : "closed"}.` });
}

// 20. Payment received
export function buildPaymentReceivedEmailHtml({ customerName,providerName,serviceType,totalPrice,date }: { customerName:string; providerName:string; serviceType:string; totalPrice:string; date?:string }): string {
  const body = `
    <div style="text-align:center;margin-bottom:28px;">${icon(`<polyline points="20 6 9 17 4 12"/>`)}
    <h1 style="font-size:24px;font-weight:900;color:${TEXT_DARK};margin:0 0 6px;">Payment received!</h1>
    <p style="font-size:15px;color:${TEXT_MUTED};margin:0;">Hi ${escapeHtml(customerName)}, payment has been received for <strong style="color:${TEXT_DARK};">${escapeHtml(serviceType)}</strong>.</p></div>
    ${card(`<table role="presentation" width="100%" cellpadding="0" cellspacing="0">${row("Service",serviceType,true)}${row("Provider",providerName)}${row("When",date || "")}<tr><td style="font-size:12px;font-weight:800;color:${ON_DARK_MUTED};text-transform:uppercase;letter-spacing:1px;border-top:1px solid ${ON_DARK_BORDER};padding-top:12px;">Total</td><td style="font-size:22px;font-weight:900;color:${ON_DARK};text-align:right;border-top:1px solid ${ON_DARK_BORDER};padding-top:12px;">${escapeHtml(totalPrice)}</td></tr></table>`)}
    ${btn("View Bookings","https://petbase.app/bookings")}
    <p style="font-size:13px;color:${TEXT_MUTED};text-align:center;margin:0;">Thank you for your service.</p>`;
  return buildEmailHtml({ title:`Payment received — PET BASE`, bodyHtml: body, preheader:`Payment received for ${serviceType}` });
}
