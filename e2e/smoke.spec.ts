import { test, expect } from "@playwright/test";

test("marketing page loads and links to app", async ({ page }) => {
  await page.goto("/");
  await expect(
    page.getByRole("heading", {
      level: 1,
      name: /train patterns, not just puzzles/i,
    })
  ).toBeVisible();
  // Header, hero, and CTA link to the trainer.
  await expect(
    page.getByRole("link", { name: /^start training$/i }).first()
  ).toBeVisible();
});

test("app root redirects to training or training sets", async ({ page }) => {
  await page.goto("/app");
  await page.waitForURL(/\/app\/(training|sets)/, { timeout: 15_000 });
  await expect(page).toHaveURL(/\/app\/(training|sets)/);
});

test("training sets page loads and shows content or empty state", async ({
  page,
}) => {
  await page.goto("/app/sets");
  await expect(
    page.getByRole("heading", { name: /training sets/i })
  ).toBeVisible();
  // After load: either seeded cards or empty state (desktop + mobile can duplicate set names)
  await expect(
    page
      .getByText(
        /no training sets|tactical fundamentals|woodpecker easy|tournament warmup/i
      )
      .first()
  ).toBeVisible({ timeout: 10_000 });
});

test("progress page loads (Progress or Reflection)", async ({ page }) => {
  await page.goto("/app/progress");
  await expect(
    page.getByRole("heading", { name: /progress|reflection/i })
  ).toBeVisible({ timeout: 10000 });
});

test("training page settles into a known state", async ({ page }) => {
  await page.goto("/app/training");
  // Loading has no sr-only `h1`; empty states use EmptyState titles instead.
  await expect(
    page
      .getByText(
        /loading|no active cycle|no active training selected|something went wrong|no training state\.|current exercise not found|cycle complete|opening your cycle|exercise\s+\d+/i
      )
      .first()
  ).toBeVisible({ timeout: 20_000 });
});
