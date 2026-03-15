import { test, expect } from "@playwright/test";

test("marketing page loads and links to app", async ({ page }) => {
  await page.goto("/");
  await expect(
    page.getByRole("heading", { name: /patternforge/i })
  ).toBeVisible();
  await expect(page.getByRole("link", { name: /get started/i })).toBeVisible();
});

test("app dashboard loads when navigating to /app", async ({ page }) => {
  await page.goto("/app");
  await expect(
    page.getByRole("heading", { name: /dashboard/i })
  ).toBeVisible();
});

test("training sets page loads and shows content or empty state", async ({
  page,
}) => {
  await page.goto("/app/sets");
  await expect(
    page.getByRole("heading", { name: /training sets/i })
  ).toBeVisible();
  // After load: either seeded cards or empty state
  await expect(
    page.getByText(/no training sets|tactical fundamentals|woodpecker easy|tournament warmup/i)
  ).toBeVisible({ timeout: 10000 });
});
