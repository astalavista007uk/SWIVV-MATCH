import { createStart, createMiddleware } from "@tanstack/react-start";
import { getRequest } from "@tanstack/react-start/server";

import { renderErrorPage } from "./lib/error-page";
import { langFromHeaders, type Lang } from "./lib/swivv-lang";
import { PRIVATE_PATH } from "./lib/seo";
import { attachSupabaseAuth } from "@/integrations/supabase/auth-attacher";

const errorMiddleware = createMiddleware().server(async ({ next, pathname }) => {
  try {
    const result = await next();
    // ponytail: noindex header covers every private route in one place — robots.txt only asks crawlers not to fetch, it never protects data
    if (PRIVATE_PATH.test(pathname)) {
      result.response.headers.set("x-robots-tag", "noindex, nofollow");
    }
    return result;
  } catch (error) {
    if (error != null && typeof error === "object" && "statusCode" in error) {
      throw error;
    }
    console.error(error);
    let lang: Lang = "fr";
    try {
      lang = langFromHeaders(getRequest().headers);
    } catch {}
    return new Response(renderErrorPage(lang), {
      status: 500,
      headers: { "content-type": "text/html; charset=utf-8" },
    });
  }
});

export const startInstance = createStart(() => ({
  functionMiddleware: [attachSupabaseAuth],
  requestMiddleware: [errorMiddleware],
}));
