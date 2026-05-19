import { test, expect } from "@playwright/test";
import {
  assertNoHorizontalOverflow,
  clearSupportPromptStorage,
  ensureCompletedCycleForPrompts,
  ensureDevTrainingDataSeeded,
  installDonationTelemetryCapture,
  isValidStripePaymentLink,
  MOBILE_VIEWPORTS,
  readDonationTelemetryEvents,
  setSupportPromptState,
  clearDonationTelemetryCapture,
  SUPPORT_PROMPT_STORAGE_KEY,
} from "./helpers/donation";

test.describe("Support page (/support)", () => {
  test.beforeEach(async ({ page }) => {
    await installDonationTelemetryCapture(page);
    await clearDonationTelemetryCapture(page);
  });

  test("loads support copy, Stripe tiers, and crypto section", async ({ page }) => {
    await page.goto("/support");

    await expect(
      page.getByRole("heading", { name: /support patternforge/i, level: 1 })
    ).toBeVisible();
    await expect(
      page.getByText(/optional support helps keep training accessible/i).first()
    ).toBeVisible();
    await expect(
      page.getByText(/personal training project inspired by disciplined repetition/i)
    ).toBeVisible();

    for (const label of ["A$5", "A$10", "A$25", "A$50"]) {
      const link = page.getByRole("link", {
        name: new RegExp(`donate ${label.replace("$", "\\$")} via stripe`, "i"),
      });
      await expect(link).toBeVisible();
      const href = await link.getAttribute("href");
      expect(isValidStripePaymentLink(href)).toBe(true);
    }

    await expect(
      page.getByRole("heading", { name: /crypto support/i, level: 3 })
    ).toBeVisible();
    await expect(page.getByTestId("crypto-qr-btc")).toBeVisible();
    await expect(page.getByTestId("crypto-qr-lightning")).toBeVisible();
  });

  test("copy address button copies wallet text", async ({
    page,
    context,
  }) => {
    await context.grantPermissions(["clipboard-read", "clipboard-write"]);
    await page.goto("/support");

    const copyButtons = page.getByRole("button", { name: /copy address/i });
    await expect(copyButtons.first()).toBeVisible();
    await copyButtons.first().click();
    await expect(page.getByRole("button", { name: /copied/i }).first()).toBeVisible();

    const clipboardText = await page.evaluate(async () =>
      navigator.clipboard.readText()
    );
    expect(clipboardText.length).toBeGreaterThan(10);
  });

  test("Stripe donation links use valid hrefs and fire checkout telemetry on click", async ({
    page,
  }) => {
    await page.route("**://buy.stripe.com/**", (route) => route.abort());
    await page.goto("/support");

    const fiveLink = page.getByTestId("stripe-donation-five");
    await expect(fiveLink).toHaveAttribute("href", /buy\.stripe\.com/);
    expect(isValidStripePaymentLink(await fiveLink.getAttribute("href"))).toBe(
      true
    );

    await fiveLink.evaluate((node) => {
      node.addEventListener(
        "click",
        (event) => {
          event.preventDefault();
        },
        { once: true, capture: true }
      );
    });
    await fiveLink.click();
    await page.waitForFunction(() =>
      (
        window as Window & {
          __donationTelemetryEvents?: Array<{ name: string }>;
        }
      ).__donationTelemetryEvents?.some(
        (event) => event.name === "donation_stripe_checkout_open"
      )
    );

    const events = await readDonationTelemetryEvents(page);
    expect(events.some((e) => e.name === "donation_stripe_checkout_open")).toBe(
      true
    );
  });

  test("fires support page view telemetry once per session", async ({ page }) => {
    await page.goto("/support");
    await page.waitForFunction(() =>
      (
        window as Window & {
          __donationTelemetryEvents?: Array<{ name: string }>;
        }
      ).__donationTelemetryEvents?.some(
        (event) => event.name === "support_page_view"
      )
    );
    await page.goto("/support");
    await page.waitForTimeout(300);

    const events = await readDonationTelemetryEvents(page);
    const pageViews = events.filter((e) => e.name === "support_page_view");
    expect(pageViews).toHaveLength(1);
  });
});

test.describe("Support page mobile layout", () => {
  test.use({ viewport: MOBILE_VIEWPORTS.iphone14 });

  test("has no horizontal overflow at 390x844", async ({ page }) => {
    await page.goto("/support");
    await expect(page.getByTestId("support-page-content")).toBeVisible();
    expect(await assertNoHorizontalOverflow(page)).toBe(true);
  });

  test("donation cards and copy buttons remain usable", async ({ page }) => {
    await page.goto("/support");

    const donationCard = page.getByTestId("stripe-donation-ten");
    const box = await donationCard.boundingBox();
    expect(box?.height ?? 0).toBeGreaterThanOrEqual(44);
    expect(box?.width ?? 0).toBeGreaterThanOrEqual(200);

    const copyButton = page.getByRole("button", { name: /copy address/i }).first();
    const copyBox = await copyButton.boundingBox();
    expect(copyBox?.height ?? 0).toBeGreaterThanOrEqual(44);
  });

  test("QR and address areas fit without horizontal scroll at 430x932", async ({
    page,
  }) => {
    await page.setViewportSize(MOBILE_VIEWPORTS.iphone14ProMax);
    await page.goto("/support");

    await expect(page.getByTestId("crypto-qr-btc")).toBeVisible();
    expect(await assertNoHorizontalOverflow(page)).toBe(true);
  });
});

test.describe("Support success page (/support/success)", () => {
  test.beforeEach(async ({ page }) => {
    await installDonationTelemetryCapture(page);
    await clearDonationTelemetryCapture(page);
  });

  test("loads thank-you content and CTAs", async ({ page }) => {
    await page.goto("/support/success");

    await expect(
      page.getByRole("heading", {
        name: /thank you for supporting patternforge/i,
        level: 1,
      })
    ).toBeVisible();
    await expect(
      page.getByText(/your support helps keep training free/i)
    ).toBeVisible();
    await expect(
      page.getByRole("link", { name: /return to training/i })
    ).toHaveAttribute("href", "/app/training");
    await expect(
      page.getByRole("link", { name: /back to support/i })
    ).toHaveAttribute("href", "/support");
  });

  test("handles Stripe query params without breaking layout", async ({
    page,
  }) => {
    await page.goto(
      "/support/success?payment_intent=test&redirect_status=succeeded"
    );

    await expect(
      page.getByRole("heading", {
        name: /thank you for supporting patternforge/i,
      })
    ).toBeVisible();
    await expect(page.getByTestId("support-success-content")).toBeVisible();
    expect(await assertNoHorizontalOverflow(page)).toBe(true);
  });

  test("fires success return telemetry once", async ({ page }) => {
    await page.goto("/support/success");
    await page.waitForFunction(() =>
      (
        window as Window & {
          __donationTelemetryEvents?: Array<{ name: string }>;
        }
      ).__donationTelemetryEvents?.some(
        (event) => event.name === "donation_stripe_success_return"
      )
    );
    await page.goto("/support/success");
    await page.waitForTimeout(300);

    const events = await readDonationTelemetryEvents(page);
    const successEvents = events.filter(
      (e) => e.name === "donation_stripe_success_return"
    );
    expect(successEvents).toHaveLength(1);
  });

  test.use({ viewport: MOBILE_VIEWPORTS.iphone14 });

  test("is readable on mobile with full-width primary CTA", async ({ page }) => {
    await page.goto("/support/success");

    const primary = page.getByRole("link", { name: /return to training/i });
    await expect(primary).toBeVisible();
    const box = await primary.boundingBox();
    expect(box?.width ?? 0).toBeGreaterThan(300);
    expect(await assertNoHorizontalOverflow(page)).toBe(true);
  });
});

test.describe("Support prompts", () => {
  test.beforeEach(async ({ page }) => {
    await installDonationTelemetryCapture(page);
    await clearSupportPromptStorage(page);
    await ensureCompletedCycleForPrompts(page);
  });

  test("appears on completed cycle summary", async ({ page }) => {
    const cycleId = await ensureCompletedCycleForPrompts(page);
    expect(cycleId.length).toBeGreaterThan(0);

    await page.goto(`/app/cycle/${cycleId}/summary`);
    await expect(page.getByTestId("support-patternforge-prompt")).toBeVisible({
      timeout: 10_000,
    });
    await expect(
      page.getByRole("link", { name: /support the project/i })
    ).toHaveAttribute("href", "/support");
  });

  test("appears on reflection progress when no active cycle", async ({ page }) => {
    await ensureCompletedCycleForPrompts(page);
    await page.goto("/app/progress");
    await expect(
      page.getByRole("heading", { name: /reflection/i })
    ).toBeVisible({ timeout: 10_000 });
    await expect(page.getByTestId("support-patternforge-prompt")).toBeVisible();
  });

  test("does not appear during training", async ({ page }) => {
    await page.goto("/app/training");
    await expect(
      page
        .getByText(
          /loading|no active cycle|no active training|exercise\s+\d+|opening your cycle/i
        )
        .first()
    ).toBeVisible({ timeout: 20_000 });
    await expect(page.getByTestId("support-patternforge-prompt")).toHaveCount(0);
  });

  test("maybe later dismisses prompt and persists after reload", async ({
    page,
  }) => {
    const cycleId = await ensureCompletedCycleForPrompts(page);
    await page.goto(`/app/cycle/${cycleId}/summary`);
    await expect(page.getByTestId("support-patternforge-prompt")).toBeVisible({
      timeout: 10_000,
    });

    await page.getByRole("button", { name: /maybe later/i }).click();
    await expect(page.getByTestId("support-patternforge-prompt")).toHaveCount(0);

    await page.reload();
    await expect(page.getByTestId("support-patternforge-prompt")).toHaveCount(0);

    const stored = await page.evaluate((key) => {
      return localStorage.getItem(key);
    }, SUPPORT_PROMPT_STORAGE_KEY);
    expect(stored).toContain("dismissedUntil");
  });

  test("support CTA records suppression and fires telemetry", async ({
    page,
  }) => {
    const cycleId = await ensureCompletedCycleForPrompts(page);
    await page.goto(`/app/cycle/${cycleId}/summary`);
    await expect(page.getByTestId("support-patternforge-prompt")).toBeVisible({
      timeout: 10_000,
    });

    await page.getByRole("link", { name: /support the project/i }).click();
    await page.waitForURL("/support");

    const stored = await page.evaluate((key) => {
      return localStorage.getItem(key);
    }, SUPPORT_PROMPT_STORAGE_KEY);
    expect(stored).toContain("supportedUntil");

    const events = await readDonationTelemetryEvents(page);
    expect(
      events.some(
        (e) =>
          e.name === "support_cta_click" &&
          e.data?.source === "cycle_completion"
      )
    ).toBe(true);
  });
});

test.describe("Support prompt suppression", () => {
  test.beforeEach(async ({ page }) => {
    await clearSupportPromptStorage(page);
    await ensureCompletedCycleForPrompts(page);
  });

  test("malformed localStorage does not crash cycle summary", async ({
    page,
  }) => {
    await page.evaluate((key) => {
      localStorage.setItem(key, "{not-json");
    }, SUPPORT_PROMPT_STORAGE_KEY);

    const cycleId = await ensureCompletedCycleForPrompts(page);
    await page.goto(`/app/cycle/${cycleId}/summary`);
    await expect(page.getByRole("heading", { name: /cycle summary/i })).toBeVisible();
    await expect(page.getByTestId("support-patternforge-prompt")).toBeVisible({
      timeout: 10_000,
    });
  });

  test("active dismiss suppression hides prompt until expired", async ({
    page,
  }) => {
    const future = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString();
    await setSupportPromptState(page, {
      dismissedUntil: future,
      supportedUntil: null,
      lastShownAt: null,
    });

    const cycleId = await ensureCompletedCycleForPrompts(page);
    await page.goto(`/app/cycle/${cycleId}/summary`);
    await expect(page.getByRole("heading", { name: /cycle summary/i })).toBeVisible();
    await expect(page.getByTestId("support-patternforge-prompt")).toHaveCount(0);
  });

  test("expired suppression allows prompt again", async ({ page }) => {
    const past = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    await setSupportPromptState(page, {
      dismissedUntil: past,
      supportedUntil: null,
      lastShownAt: null,
    });

    const cycleId = await ensureCompletedCycleForPrompts(page);
    await page.goto(`/app/cycle/${cycleId}/summary`);
    await expect(page.getByTestId("support-patternforge-prompt")).toBeVisible({
      timeout: 10_000,
    });
  });
});

test.describe("Donation regression", () => {
  test("training flow loads without support prompt overlay", async ({ page }) => {
    await ensureDevTrainingDataSeeded(page);
    await page.goto("/app/training");
    await expect(
      page
        .getByText(
          /loading|no active cycle|no active training|exercise\s+\d+|opening your cycle/i
        )
        .first()
    ).toBeVisible({ timeout: 20_000 });
    await expect(page.getByTestId("support-patternforge-prompt")).toHaveCount(0);
  });

  test("support pages do not expose Stripe secret keys in HTML", async ({
    page,
  }) => {
    await page.goto("/support");
    const html = await page.content();
    expect(html).not.toMatch(/sk_live_|sk_test_|STRIPE_SECRET/i);
    expect(html).not.toMatch(/NEXT_PUBLIC_STRIPE_(?!DONATION_LINK)/i);
  });
});
