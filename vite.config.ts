// @lovable.dev/vite-tanstack-config already includes the following — do NOT add them manually
// or the app will break with duplicate plugins:
//   - tanstackStart, viteReact, tailwindcss, tsConfigPaths, nitro (build-only using cloudflare as a default target),
//     componentTagger (dev-only), VITE_* env injection, @ path alias, React/TanStack dedupe,
//     error logger plugins, and sandbox detection (port/host/strictPort).
// You can pass additional config via defineConfig({ vite: { ... }, etc... }) if needed.
import { defineConfig } from "@lovable.dev/vite-tanstack-config";
import type { Plugin } from "vite";
import { existsSync, readFileSync } from "node:fs";

/**
 * Strips `data-tsd-source` attributes injected by @tanstack/devtools-vite.
 *
 * The devtools AST transform assigns slightly different source positions
 * (line:column) in the SSR vs client pipelines, causing React hydration
 * mismatch warnings in dev. This post-transform removes the attributes from
 * both pipelines so the rendered HTML is deterministic.
 *
 * Production builds don't include the devtools plugin, so this is a no-op.
 */
function stripTsdSource(): Plugin {
  return {
    name: "strip-tsd-source",
    enforce: "post",
    transform(code, id) {
      if (id.includes("node_modules") || !code.includes("data-tsd-source")) return null;
      const stripped = code.replace(/"data-tsd-source"\s*:\s*"[^"]*",?\s*/g, "");
      if (stripped === code) return null;
      return { code: stripped, map: null };
    },
  };
}

export default defineConfig({
  tanstackStart: {
    // Redirect TanStack Start's bundled server entry to src/server.ts (our SSR error wrapper).
    // nitro/vite builds from this
    server: { entry: "server" },
  },
  vite: {
    plugins: [stripTsdSource()],
    server: {
      // ponytail: self-signed .https/ cert makes LAN a secure context (mic/camera on mobile) — plain http if certs absent; regen if the LAN IP changes
      ...(existsSync(".https/key.pem") && existsSync(".https/cert.pem")
        ? { https: { key: readFileSync(".https/key.pem"), cert: readFileSync(".https/cert.pem") } }
        : {}),
      // ponytail: pinned dev port so the URL never moves — drop strictPort if a sandbox needs to remap it
      port: 5273,
      strictPort: true,
      host: true,
      proxy: {
        "/supabase-api": {
          target: "http://127.0.0.1:55321",
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/supabase-api/, ""),
          ws: true,
        },
      },
    },
  },
});
