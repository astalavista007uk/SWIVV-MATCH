/**
 * Rewrite a Supabase storage URL to a path-relative URL so the browser
 * resolves it against the current origin.
 *
 * Why: when photos are uploaded, `supabase.storage.getPublicUrl(path)` bakes
 * the *current* host into the URL (e.g. `http://localhost:8080/supabase-api/...`).
 * That URL is then persisted into DB columns. When another device (e.g. a
 * phone on the same WiFi) renders the image, `localhost` resolves to the
 * phone itself and the image fails to load.
 *
 * Fix: strip the host and return just the path (`/supabase-api/storage/v1/object/public/<bucket>/<path>`).
 * The browser then resolves it against whatever origin was used to load the
 * app — `http://localhost:8080` on desktop, `http://192.168.x.x:8080` on mobile.
 *
 * Falls through unchanged for any non-storage URL (mock Unsplash URLs, blob:,
 * data:, https:// signed URLs, etc.).
 */
export function resolveStorageUrl(url: string): string;
export function resolveStorageUrl(url: string | null | undefined): string | null;
export function resolveStorageUrl(url: string | null | undefined): string | null {
  if (!url) return null;

  // Already a relative path — return as-is.
  if (url.startsWith("/supabase-api/")) return url;

  // Match `/supabase-api/storage/v1/object/public/<bucket>/<path>` anywhere in the string.
  const proxiedMatch = url.match(/\/supabase-api\/storage\/v1\/object\/public\/.+$/);
  if (proxiedMatch) return proxiedMatch[0];

  // Direct Supabase URL without the proxy prefix (e.g. http://127.0.0.1:54321/storage/v1/object/public/...).
  const directMatch = url.match(/\/storage\/v1\/object\/public\/[^/]+\/.+$/);
  if (directMatch) return `/supabase-api${directMatch[0]}`;

  // Bare storage path: looks like `<uuid>/<filename>` (no protocol, no leading /)
  // Assume it's in the avatars bucket.
  if (!url.startsWith("http") && !url.startsWith("/") && !url.startsWith("data:") && !url.startsWith("blob:") &&
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\//.test(url)) {
    return `/supabase-api/storage/v1/object/public/avatars/${url}`;
  }

  // Anything else (Unsplash, blob:, data:, absolute https://) — pass through.
  return url;
}
