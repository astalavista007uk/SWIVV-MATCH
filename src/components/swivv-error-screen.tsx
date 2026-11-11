import { useEffect } from "react";
import { errorScreenHtml } from "@/lib/error-page";
import { useLang } from "@/lib/i18n";
import { logClientError } from "@/lib/swivv-error-log";

/**
 * Global crash screen (router defaultErrorComponent + root errorComponent).
 * ponytail: markup comes from error-page.ts, the same source as the 500 page — one copy to keep.
 */
export function SwivvErrorScreen({ error }: { error?: unknown }) {
  const lang = useLang();
  useEffect(() => {
    logClientError(error instanceof Error ? error.message : String(error ?? "Erreur de rendu"), "render");
  }, [error]);
  return <div dangerouslySetInnerHTML={{ __html: errorScreenHtml(lang) }} />;
}
