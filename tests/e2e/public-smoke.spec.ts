import { expect, test } from "@playwright/test";

test("public landing page renders", async ({ page }) => {
  await page.goto("/");

  await expect(page).toHaveTitle(/SoNash/i);
  await expect(page.locator("main")).toBeVisible();
});

test("public manifest is available", async ({ request }) => {
  const response = await request.get("/manifest.json");

  expect(response.ok()).toBeTruthy();
  expect((await response.json()).name).toMatch(/SoNash/i);
});
