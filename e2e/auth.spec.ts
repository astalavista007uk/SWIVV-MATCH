import { expect, test, type Page } from "@playwright/test";
import { confirmUserByEmail, deleteUserByEmail } from "./helpers/supabase";
import { AUTH_EMAIL } from "./helpers/env";

const PASSWORD = "SwivvTest-2026!";
const NAME = "QA Test";

async function continueStep(page: Page) {
  await page.getByRole("button", { name: "Sauvegarder et continuer" }).click();
}

async function goToBirthdate(page: Page) {
  await page.goto("/inscription");
  await page.getByRole("radiogroup", { name: "Genre", exact: true }).getByRole("radio", { name: "Une femme" }).click();
  await page.getByRole("radiogroup", { name: "Genre recherché", exact: true }).getByRole("radio", { name: "Un homme" }).click();
  await continueStep(page);
  await page.locator('input[type="number"]').nth(0).fill("25");
  await page.locator('input[type="number"]').nth(1).fill("45");
  await continueStep(page);
}

async function fillSignupToConsent(page: Page) {
  await goToBirthdate(page);
  await page.locator('input[type="date"]').fill("1990-01-01");
  await continueStep(page);
  await page.locator('input[placeholder="Paris"]').fill("Paris");
  await continueStep(page);
  await page.locator('input[placeholder="Camille"]').fill(NAME);
  await continueStep(page);
  await page.locator('input[type="email"]').fill(AUTH_EMAIL);
  await continueStep(page);
  await page.locator('input[type="password"]').nth(0).fill(PASSWORD);
  await page.locator('input[type="password"]').nth(1).fill(PASSWORD);
  await continueStep(page);
}

test.describe.configure({ mode: "serial" });

test.beforeEach(async () => {
  await deleteUserByEmail(AUTH_EMAIL);
});

test.afterEach(async () => {
  await deleteUserByEmail(AUTH_EMAIL);
});

test("under-18 birthdate is blocked", async ({ page }) => {
  await goToBirthdate(page);
  await page.locator('input[type="date"]').fill("2015-01-01");
  await continueStep(page);
  await expect(page.getByRole("alert")).toContainText("18 ans et plus");
  await expect(page.locator('input[type="date"]')).toBeVisible();
});

test("signup shows the pending banner and completes after confirmation", async ({ page }) => {
  await fillSignupToConsent(page);

  // The CGU accept button is scroll-gated.
  await page.getByRole("button", { name: "Ouvrir les CGU détaillées" }).click();
  const cgu = page.getByRole("dialog");
  const accept = cgu.getByRole("button", { name: "Accepter" });
  await expect(accept).toBeDisabled();
  await cgu.locator(".overflow-y-auto").first().evaluate((el) => {
    el.scrollTop = el.scrollHeight;
    el.dispatchEvent(new Event("scroll", { bubbles: true }));
  });
  await expect(accept).toBeEnabled();
  await accept.click();

  await page.getByRole("checkbox").nth(0).check();
  await page.getByRole("checkbox").nth(1).check();
  await page.getByRole("button", { name: "Créer mon compte" }).click();

  await expect(page.getByRole("dialog")).toContainText("Merci pour ton inscription", { timeout: 60_000 });
  await page.getByRole("button", { name: "OK" }).click();
  await expect(page).toHaveURL(/\/mon-profil/);
  await expect(page.getByText(/en attente de confirmation/)).toBeVisible();

  // Confirmation e-mail delivery is covered by e2e/mail.spec.ts; this flow proves
  // the banner/pending-profile hand-off without depending on an external inbox.
  await confirmUserByEmail(AUTH_EMAIL);

  await page.getByRole("button", { name: "S'inscrire | Se connecter" }).first().click();
  const authDialog = page.getByRole("dialog");
  await authDialog.getByRole("tab", { name: "Se connecter" }).click();
  await authDialog.locator("#swivv-email").fill(AUTH_EMAIL);
  await authDialog.locator("#swivv-password").fill(PASSWORD);
  await authDialog.getByRole("button", { name: "Se connecter" }).click();
  await expect(authDialog).toBeHidden({ timeout: 20_000 });

  await page.goto("/mon-profil");
  await expect(page.locator("body")).toContainText(NAME, { timeout: 30_000 });
  await expect(page.getByText(/en attente de confirmation/)).toHaveCount(0);
});
