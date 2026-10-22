import { createStart, createMiddleware } from "@tanstack/react-start";

import { renderErrorPage } from "./lib/error-page";
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
    return new Response(renderErrorPage(), {
      status: 500,
      headers: { "content-type": "text/html; charset=utf-8" },
    });
  }
});

export const startInstance = createStart(() => ({
  functionMiddleware: [attachSupabaseAuth],
  requestMiddleware: [errorMiddleware],
}));
