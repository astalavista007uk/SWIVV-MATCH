import { expect, test } from "@playwright/test";
import { cleanupContactByToken, findContactByToken } from "./helpers/supabase";
import { TEST_EMAIL } from "./helpers/env";

const CASES = [
  { subject: "Signaler un abus ou un faux profil", email: TEST_EMAIL },
  { subject: "Supprimer mes données", email: "support@swivvmatch.com" },
];

for (const { subject, email } of CASES) {
  test(`contact "${subject}" creates a ticket and shows the visitor confirmation`, async ({ page }) => {
    const token = `QA-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    try {
      await page.goto("/contact-us");
      await expect(page.getByRole("heading", { name: "Parlons-nous" })).toBeVisible();
      // ponytail: wait for hydration before touching controlled fields — early fills get reset by React
      await page.waitForTimeout(1500);
      await page.locator("#subject").selectOption({ label: subject });
      await page.locator("#name").fill("QA Contact");
      await page.locator("#email").fill(email);
      await page.locator("#message").fill(`${token} — ${subject}`);
      await page.getByRole("button", { name: "Envoyer" }).click();

      await expect(page.getByText("Merci !")).toBeVisible({ timeout: 30_000 });
      await expect(page.getByText(/Ton message a bien été reçu/)).toContainText(email);

      const row = await findContactByToken(token);
      expect(row?.ticket.subject).toBe(`[Site] ${subject}`);
      expect(row?.message.body).toContain(token);
    } finally {
      await cleanupContactByToken(token);
    }
  });
}
