// ponytail: no statement table, no cron — statements derive deterministically from the real
// account creation date, so duplicates are impossible by construction and there is nothing to
// sync; only fully completed months appear (the current month is never billed, not even 0 €).
// ponytail: no pdf dependency — a one-page statement needs ~40 lines of hand-rolled PDF 1.4
// with base-14 Helvetica; adopt jsPDF/pdf-lib if statements ever need images, tables or unicode beyond Latin-1.
export interface FreeStatement {
  year: number;
  month: number; // 1-12
  ref: string;
  issueIso: string; // last day of the covered month
  fileName: string;
}

const MONTH_FMT = new Intl.DateTimeFormat("fr-FR", { month: "long", year: "numeric" });
const DATE_FMT = new Intl.DateTimeFormat("fr-FR", { day: "numeric", month: "long", year: "numeric" });

// ponytail: FNV-1a 32-bit for a stable per-member suffix — crypto hash if refs ever become adversarial
function shortHash(s: string): string {
  let h = 0x811c9dc5;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return (h >>> 0).toString(16).padStart(8, "0").slice(0, 4).toUpperCase();
}

export function statementRef(uid: string, year: number, month: number): string {
  return `SWIVV-RLV-${year}${String(month).padStart(2, "0")}-${shortHash(uid)}`;
}

export function freeStatements(createdAtIso: string, uid: string, now = new Date()): FreeStatement[] {
  const created = new Date(createdAtIso);
  if (Number.isNaN(created.getTime())) return [];
  // Last fully completed month: the month before the current one, newest first.
  let y = now.getFullYear();
  let m = now.getMonth(); // 0-based current month -> previous month is the newest eligible
  const out: FreeStatement[] = [];
  const cy = created.getFullYear();
  const cm = created.getMonth() + 1;
  while (y > cy || (y === cy && m >= cm)) {
    const lastDay = new Date(y, m, 0);
    out.push({
      year: y,
      month: m,
      ref: statementRef(uid, y, m),
      issueIso: lastDay.toISOString().slice(0, 10),
      fileName: `SWIVV-MATCH-Releve-Gratuit-${y}-${String(m).padStart(2, "0")}.pdf`,
    });
    m -= 1;
    if (m < 1) { m = 12; y -= 1; }
  }
  return out;
}

export const statementMonthLabel = (s: FreeStatement) =>
  MONTH_FMT.format(new Date(s.year, s.month - 1, 1));
export const formatFrDate = (iso: string) => DATE_FMT.format(new Date(iso + "T12:00:00"));

// ponytail: first-name-only addressing (never a raw email) — profile name wins, else a prettified
// email local-part, else generic; full identity resolution if statements ever need legal names
export function billToFirstName(profileName: string | null | undefined, email: string | null | undefined): string {
  const first = (profileName ?? "").trim().split(/\s+/)[0];
  // ponytail: email-like stored name is a missing name (autofill legacy), not an addressee — prettified local-part below, generic after that
  if (first && !first.includes("@")) return first;
  const local = (email ?? "").split("@")[0].replace(/[._-]+/g, " ").replace(/\d+/g, "").trim().split(/\s+/)[0];
  if (local) return local.charAt(0).toUpperCase() + local.slice(1);
  return "Membre";
}

// --- Minimal PDF 1.4 writer (Latin-1/WinAnsi only) -------------------------------------------
// ponytail: text is mapped into WinAnsi single bytes (€→0x80, curly ’→'); full unicode if branding ever needs it
function pdfText(s: string): string {
  return s
    .replace(/’/g, "'")
    .replace(/—/g, "-") // ponytail: WinAnsi has no em-dash slot via our latin1 path (rendered as "?") — full unicode if typography ever needs it
    .replace(/€/g, "\x80")
    .replace(/[\u00a0\u202f]/g, " ")
    .split("")
    .map((c) => {
      const n = c.charCodeAt(0);
      const b = n > 255 ? 0x3f : n; // ? fallback, never silent multibyte
      const ch = String.fromCharCode(b);
      return ch === "(" || ch === ")" || ch === "\\" ? "\\" + ch : ch;
    })
    .join("");
}

import { STATEMENT_ART } from "./statement-art";

export interface PdfArt {
  sMark?: { bytes: Uint8Array; w: number; h: number; filter: string };
  footer?: { bytes: Uint8Array; w: number; h: number; filter: string };
}

// ponytail: art is baked into the bundle (base64 JPEG, fetch-free) — browser fetch of the public
// files fails in some environments (blockers/proxies) and the fallback shapes then draw instead
// of the photos; baked bytes can't fail to load. Facturation chunk grows (~150 KB, route-lazy).
function bakedArt(): PdfArt {
  const dec = (b64: string) => Uint8Array.from(atob(b64), (c) => c.charCodeAt(0));
  const im = (t: { b64: string; w: number; h: number; filter: string }) => ({
    bytes: dec(t.b64),
    w: t.w,
    h: t.h,
    filter: t.filter,
  });
  return {
    sMark: ("sMark" in STATEMENT_ART) ? im((STATEMENT_ART as any).sMark) : undefined,
    footer: ("footer" in STATEMENT_ART) ? im((STATEMENT_ART as any).footer) : undefined,
  };
}

function latin1(s: string): Uint8Array {
  const b = new Uint8Array(s.length);
  for (let i = 0; i < s.length; i++) b[i] = s.charCodeAt(i) & 0xff;
  return b;
}

export function buildFreeStatementPdf(s: FreeStatement, memberName: string, memberSinceIso: string, art: PdfArt = bakedArt()): Uint8Array {
  // ponytail: no banner — content starts at the top; the S mark keeps the top-right branding alone —
  // vector/photo band experiments removed after the phone viewer kept dropping that raster (S-mark +
  // wordmark draw fine everywhere, so they stay). Re-add a band only as layered art with a vector base.
  // DE+FACTURÉ-À+DATE header block / pink rules / totals / footer wordmark tight above the line —
  // no payment/tax/company blocks (inventing those would be fraud-adjacent).
  const G = "0.9137 0.1176 0.3882"; // heart pink #e91e63 — matches the logo heart
  const L: string[] = [];
  const T = (x: number, yy: number, size: number, bold: boolean, color: string, text: string) => {
    L.push(`BT /F${bold ? "B" : "R"} ${size} Tf ${color} rg ${x} ${yy} Td (${pdfText(text)}) Tj ET`);
  };
  // ponytail: minimal Helvetica width map (footer centering only) — full AFM parse if centered text spreads
  const WW: Record<string, number> = { " ": 278, ".": 278, ",": 278, ":": 278, "-": 333, "+": 584, "@": 737, "—": 1000, "€": 556, A: 667, C: 722, D: 722, F: 611, H: 722, I: 278, M: 833, P: 667, R: 722, S: 667, T: 611, V: 667, W: 944, a: 556, c: 500, d: 556, e: 556, f: 278, g: 556, h: 556, i: 222, l: 222, m: 833, n: 556, o: 556, p: 556, r: 333, s: 500, t: 278, u: 556, w: 722, x: 500, y: 500, "é": 556, "è": 556, "0": 556, "1": 556, "2": 556, "3": 556, "4": 556, "5": 556, "6": 556, "7": 556, "8": 556, "9": 556 };
  const TC = (yy: number, size: number, color: string, text: string) => {
    const t = pdfText(text);
    let u = 0;
    for (const c of t) u += WW[c] ?? 500;
    T(50 + (495 - (u * size) / 1000) / 2, yy, size, false, color, text);
  };
  const TR = (xr: number, yy: number, size: number, bold: boolean, color: string, text: string) => {
    const t = pdfText(text);
    let u = 0;
    for (const c of t) u += WW[c] ?? 500;
    T(xr - (u * size) / 1000, yy, size, bold, color, text);
  };
  const rule = (yy: number, x0 = 79, x1 = 497) => { L.push(`${G} RG 0.8 w ${x0} ${yy} m ${x1} ${yy} l S`); };
  // ponytail: brand band is pure vector (renders everywhere) — slim navy band with the white
  // wordmark and two tonal discs; doubles as the page header so body starts below it.
  // No raster here by design (see banner saga above).
  const NV = "0.059 0.118 0.2"; // deep navy #0f1e33
  L.push(`${NV} rg 16 770 m 566 770 l 576 770 l 576 824 l 566 834 l 26 834 l 16 824 l 16 770 l h f`);
  L.push(`0.043 0.082 0.149 rg 470 772 m 500 772 l 500 832 l 470 832 l h f`);
  L.push(`${G} rg 500 772 m 530 772 l 530 832 l 500 832 l h f`);
  T(36, 796, 18, true, "1 1 1", "SWIVV MATCH");
  // ponytail: accent line hugs the band (4pt below it) so the title gets a clear 10pt gap —
  // moving the title block instead would cascade through every row below
  L.push(`${G} RG 2 w 16 766 m 576 766 l S`);
  // Title + ref left
  T(79, 745, 16, true, "0 0 0", "RELEVÉ MENSUEL D'ACCÈS GRATUIT");
  T(79, 726, 10, false, "0 0 0", s.ref);
  // Three-column header: DE / FACTURÉ À / DATE D'ÉMISSION (+ periode couverte & compte créé)
  T(79, 697, 9, false, "0.55 0.55 0.55", "DE"); T(219, 697, 9, false, "0.55 0.55 0.55", "FACTURÉ À"); T(379, 697, 9, false, "0.55 0.55 0.55", "DATE D'ÉMISSION");
  T(79, 681, 11, true, "0 0 0", "SWIVV MATCH"); T(219, 681, 11, true, "0 0 0", memberName); T(379, 681, 11, false, "0 0 0", formatFrDate(s.issueIso));
  T(379, 657, 9, false, "0.55 0.55 0.55", "PÉRIODE COUVERTE");
  T(219, 641, 10, false, "0 0 0", `Compte créé le ${formatFrDate(memberSinceIso.slice(0, 10))}`); T(379, 641, 11, false, "0 0 0", statementMonthLabel(s));
  rule(618);
  // Description table (DESCRIPTION/QTÉ/PRIX/MONTANT) on a tinted header row
  L.push(`0.992 0.941 0.961 rg 79 594 re 418 18 re f`);
  T(79, 602, 9, false, "0.55 0.55 0.55", "DESCRIPTION"); T(330, 602, 9, false, "0.55 0.55 0.55", "QTÉ"); T(396, 602, 9, false, "0.55 0.55 0.55", "PRIX"); TR(497, 602, 9, false, "0.55 0.55 0.55", "MONTANT");
  rule(582);
  T(79, 566, 11, false, "0 0 0", "Accès aux fonctionnalités gratuites"); T(330, 566, 11, false, "0 0 0", "1"); T(396, 566, 11, false, "0 0 0", "0,00 €"); TR(497, 566, 11, true, "0 0 0", "0,00 €");
  T(79, 549, 10, false, "0.35 0.35 0.35", "SWIVV MATCH — relevé mensuel");
  rule(530);
  // Totals (nothing taxed on 0 €)
  TR(443, 513, 12, true, "0 0 0", "Total"); TR(497, 513, 12, true, G, "0,00 €");
  TR(443, 487, 11, true, "0 0 0", "Total à payer"); TR(497, 487, 11, true, G, "0,00 €");
  // PAIEMENT + NOTES
  T(79, 460, 9, false, "0.55 0.55 0.55", "PAIEMENT");
  T(79, 445, 11, false, "0 0 0", "Aucun paiement n'est dû au titre de ce relevé.");
  T(79, 413, 9, false, "0.55 0.55 0.55", "NOTES");
  // ponytail: single 9pt line (at 10pt it overflows the text width to the table edge) — wrap helper if disclaimers ever grow
  T(79, 398, 9, false, "0.35 0.35 0.35", "Ce document constate un accès gratuit : il ne constitue ni une preuve de paiement, ni une facture au sens fiscal.");
  // Footer: cropped wordmark centred, tight above the green line (reference: mark bottom ~8pt above the rule)
  if (art?.footer) {
    const fw = 132, fh = (fw * art.footer.h) / art.footer.w;
    L.push(`q ${fw} 0 0 ${fh} ${(595 - fw) / 2} 52 cm /Im0 Do Q`);
  }
  rule(44, 33, 561);
  TC(31, 9, "0.35 0.35 0.35", "SWIVV MATCH — 10 Rue Thureau Dangin, 75015 Paris, France - Tél : +33 6 60 36 82 20");
  TC(17, 9, "0.35 0.35 0.35", "www.swivvmatch.com - contact@swivvmatch.com");
  const content = L.join("\n");
  const imgs = [
    ...(art?.footer ? [{ name: "Im0", ...art.footer }] : []),
  ];
  const xobj = imgs.length ? ` /XObject << ${imgs.map((im, i) => `/${im.name} ${7 + i} 0 R`).join(" ")} >>` : "";
  const head: string[] = [
    "<< /Type /Catalog /Pages 2 0 R >>",
    "<< /Type /Pages /Kids [3 0 R] /Count 1 >>",
    `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /Font << /FR 4 0 R /FB 5 0 R >>${xobj} >> /Contents 6 0 R >>`,
    "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>",
    "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold /Encoding /WinAnsiEncoding >>",
    `<< /Length ${content.length} >>\nstream\n${content}\nendstream`,
  ];
  // ponytail: parts-based assembly (byte offsets, binary-safe) — string concat if images ever go away
  const parts: Uint8Array[] = [latin1("%PDF-1.4\n")];
  const offsets: number[] = [];
  let pos = parts[0].length;
  const pushObj = (body: Uint8Array) => {
    offsets.push(pos);
    const h = latin1(`${offsets.length} 0 obj\n`);
    const f = latin1("\nendobj\n");
    parts.push(h, body, f);
    pos += h.length + body.length + f.length;
  };
  head.forEach((o) => pushObj(latin1(o)));
  for (const im of imgs) {
    const h = latin1(`<< /Type /XObject /Subtype /Image /Width ${im.w} /Height ${im.h} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter ${im.filter} /Length ${im.bytes.length} >>\nstream\n`);
    const f = latin1("\nendstream");
    offsets.push(pos);
    const oh = latin1(`${offsets.length} 0 obj\n`);
    const of = latin1("\nendobj\n");
    parts.push(oh, h, im.bytes, f, of);
    pos += oh.length + h.length + im.bytes.length + f.length + of.length;
  }
  const n = offsets.length + 1;
  const tail = latin1(`xref\n0 ${n}\n0000000000 65535 f \n${offsets.map((o) => `${String(o).padStart(10, "0")} 00000 n `).join("\n")}\ntrailer\n<< /Size ${n} /Root 1 0 R >>\nstartxref\n${pos}\n%%EOF`);
  parts.push(tail);
  const bytes = new Uint8Array(pos + tail.length);
  let at = 0;
  for (const p of parts) { bytes.set(p, at); at += p.length; }
  return bytes;
}

function statementBlob(s: FreeStatement, memberName: string, memberSinceIso: string): Blob {
  return new Blob([buildFreeStatementPdf(s, memberName, memberSinceIso) as unknown as BlobPart], { type: "application/pdf" });
}

export function downloadFreeStatementPdf(s: FreeStatement, memberName: string, memberSinceIso: string): void {
  // ponytail: object-URL anchor download (no server round-trip, no document URL to guard) — nisi download attribute ignored, fall back to open
  const blob = statementBlob(s, memberName, memberSinceIso);
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = s.fileName;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 5000);
}

// ponytail: same bytes as the download, opened in a tab (native PDF viewer, iPhone Safari included) — embedded iframe if preview ever needs to stay in-page
export function viewFreeStatementPdf(s: FreeStatement, memberName: string, memberSinceIso: string): void {
  const url = URL.createObjectURL(statementBlob(s, memberName, memberSinceIso));
  window.open(url, "_blank", "noopener");
  setTimeout(() => URL.revokeObjectURL(url), 60000);
}

export function demoFreeStatementPdf(): void {
  // ponytail: runnable self-check — node has no document/Blob URL, so assert bytes here and click-test in the browser
  const bytes = buildFreeStatementPdf(
    { year: 2026, month: 9, ref: "SWIVV-RLV-202609-AB12", issueIso: "2026-09-30", fileName: "x.pdf" },
    "Test Membre",
    "2026-01-15T10:00:00Z",
  );
  const head = String.fromCharCode(...bytes.slice(0, 8));
  console.assert(head === "%PDF-1.4", `bad header: ${head}`);
  console.assert(bytes[bytes.length - 1] === 0x46 && bytes[bytes.length - 2] === 0x4f, "bad EOF");
  console.log("free-statement pdf self-check ok,", bytes.length, "bytes");
}
