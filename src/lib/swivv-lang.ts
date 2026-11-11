export const LANGS = ["fr", "en", "es"] as const;
export type Lang = (typeof LANGS)[number];

export const LANG_COOKIE = "swivv_lang";

/**
 * ponytail: first-visit language comes from a country header when the host sends one
 * (Cloudflare cf-ipcountry, or x-country from a proxy) — no GeoIP dependency, no lookup call.
 * The SSR <html lang> is the client's fallback, so hydration always agrees with the server.
 * Ceiling: our Caddy VPS sends no country header, so first visits get French until the visitor
 * picks a language; add a GeoIP module in Caddy if that ever matters.
 */
const FR_COUNTRIES = new Set(
  "FR BE LU MC CH DZ MA TN SN CI CM BF ML NE TD GN TG BJ GA CG CD CF MG MU SC RW BI DJ KM MR HT".split(
    " ",
  ),
);
const ES_COUNTRIES = new Set(
  "ES MX AR CO CL PE VE EC GT CU BO DO HN PY SV NI CR PA UY PR GQ".split(" "),
);

export function langFromCountry(
  country: string | undefined | null,
  region?: string | undefined | null,
): Lang {
  const cc = (country ?? "").toUpperCase();
  if (FR_COUNTRIES.has(cc)) return "fr";
  if (ES_COUNTRIES.has(cc)) return "es";
  // ponytail: Canada is the one mixed country — Québec is French, the rest is English
  if (cc === "CA") return (region ?? "").toUpperCase() === "QC" ? "fr" : "en";
  return cc ? "en" : "fr";
}

/** Explicit cookie wins, then the CDN country — used by the crash page, which has no React. */
export function langFromHeaders(headers: Headers): Lang {
  const cookie = headers.get("cookie") ?? "";
  const hit = cookie.match(/(?:^|;\s*)swivv_lang=([^;]*)/);
  if (hit?.[1] === "fr" || hit?.[1] === "en" || hit?.[1] === "es") return hit[1];
  return langFromCountry(
    headers.get("cf-ipcountry") ?? headers.get("x-country"),
    headers.get("x-country-region"),
  );
}
