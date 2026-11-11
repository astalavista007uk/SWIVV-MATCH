import { describe, expect, test } from "bun:test";
import { renderErrorPage } from "../src/lib/error-page";
import { langFromHeaders } from "../src/lib/swivv-lang";

describe("error page", () => {
  test("shared copies in public/ stay byte-identical to the live 500 page", async () => {
    for (const [lang, file] of [
      ["fr", "public/swivv-erreur.html"],
      ["en", "public/swivv-erreur-en.html"],
      ["es", "public/swivv-erreur-es.html"],
    ] as const) {
      expect(await Bun.file(file).text()).toBe(renderErrorPage(lang));
    }
  });

  test("apologises and offers a way out in all three languages", () => {
    for (const [lang, sorry, retry] of [
      ["fr", "Désolé pour la gêne occasionnée", "Réessayer"],
      ["en", "Sorry for the inconvenience", "Try again"],
      ["es", "Disculpa las molestias", "Reintentar"],
    ] as const) {
      const html = renderErrorPage(lang);
      expect(html).toContain(sorry);
      expect(html).toContain(retry);
      expect(html).toContain(`<html lang="${lang}">`);
      expect(html).toContain("location.reload()");
      expect(html).toContain('href="/"');
      expect(html).toContain('class="eyebrow"');
      expect(html).toContain('class="code" aria-hidden="true">500');
      expect(html).toContain("background-size: 78px 78px");
      expect(html).toContain('src="/s-mark-grey.png"');
      expect(html).toContain("prefers-reduced-motion");
    }
  });

  test("crash page language follows the cookie, then the IP", () => {
    expect(langFromHeaders(new Headers({ "x-vercel-ip-country": "ES" }))).toBe("es");
    expect(langFromHeaders(new Headers({ "x-vercel-ip-country": "MA" }))).toBe("fr");
    expect(langFromHeaders(new Headers({ "x-vercel-ip-country": "US" }))).toBe("en");
    expect(
      langFromHeaders(new Headers({ "x-vercel-ip-country": "ES", cookie: "swivv_lang=en" })),
    ).toBe("en");
    expect(langFromHeaders(new Headers())).toBe("fr");
  });
});
