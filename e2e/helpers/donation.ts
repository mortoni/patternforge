import type { Page } from "@playwright/test";

export type DonationTelemetryEvent = {
  name: string;
  data?: Record<string, unknown>;
};

export const MOBILE_VIEWPORTS = {
  iphone14: { width: 390, height: 844 },
  iphone14ProMax: { width: 430, height: 932 },
} as const;

export const SUPPORT_PROMPT_STORAGE_KEY = "patternforge-support-prompt-state";
export const SUPPORT_PROMPT_SESSION_SHOWN_KEY =
  "patternforge-support-prompt-shown-session";

const STRIPE_PAYMENT_LINK_PATTERN =
  /^https:\/\/buy\.stripe\.com\/(?:test_)?[A-Za-z0-9]+$/;

const E2E_DONATION_TELEMETRY_KEY = "patternforge-e2e-donation-telemetry";

/** Capture donation telemetry events in the browser (E2E only). */
export async function installDonationTelemetryCapture(page: Page): Promise<void> {
  await page.addInitScript((storageKey: string) => {
    type TelemetryEvent = {
      name: string;
      data?: Record<string, unknown>;
    };

    const readStored = (): TelemetryEvent[] => {
      try {
        const raw = sessionStorage.getItem(storageKey);
        return raw ? (JSON.parse(raw) as TelemetryEvent[]) : [];
      } catch {
        return [];
      }
    };

    const persist = (events: TelemetryEvent[]) => {
      try {
        sessionStorage.setItem(storageKey, JSON.stringify(events));
      } catch {
        // ignore
      }
    };

    const events = readStored();
    const capture = events as TelemetryEvent[] & {
      push: (...items: TelemetryEvent[]) => number;
    };

    capture.push = (...items: TelemetryEvent[]) => {
      const length = Array.prototype.push.apply(events, items);
      persist(events);
      return length;
    };

    (
      window as Window & {
        __donationTelemetryEvents?: TelemetryEvent[];
      }
    ).__donationTelemetryEvents = capture;
  }, E2E_DONATION_TELEMETRY_KEY);
}

export async function clearDonationTelemetryCapture(page: Page): Promise<void> {
  await page.goto("/");
  await page.evaluate((storageKey: string) => {
    sessionStorage.removeItem(storageKey);
    sessionStorage.removeItem(
      "patternforge-donation-telemetry-fired:support_page_view"
    );
    sessionStorage.removeItem(
      "patternforge-donation-telemetry-fired:donation_stripe_success_return"
    );
    delete (
      window as Window & {
        __donationTelemetryEvents?: unknown;
      }
    ).__donationTelemetryEvents;
  }, E2E_DONATION_TELEMETRY_KEY);
}

export async function readDonationTelemetryEvents(
  page: Page
): Promise<DonationTelemetryEvent[]> {
  return page.evaluate(() => {
    const events = (
      window as Window & {
        __donationTelemetryEvents?: DonationTelemetryEvent[];
      }
    ).__donationTelemetryEvents;
    return events ?? [];
  });
}

export async function clearSupportPromptStorage(page: Page): Promise<void> {
  await page.goto("/");
  await page.evaluate(
    ({
      storageKey,
      sessionKey,
    }: {
      storageKey: string;
      sessionKey: string;
    }) => {
      localStorage.removeItem(storageKey);
      localStorage.removeItem("patternforge-support-prompt-hidden-until");
      sessionStorage.removeItem(sessionKey);
      sessionStorage.removeItem("patternforge-donation-telemetry-fired:support_page_view");
      sessionStorage.removeItem(
        "patternforge-donation-telemetry-fired:donation_stripe_success_return"
      );
    },
    {
      storageKey: SUPPORT_PROMPT_STORAGE_KEY,
      sessionKey: SUPPORT_PROMPT_SESSION_SHOWN_KEY,
    }
  );
}

export async function setSupportPromptState(
  page: Page,
  state: unknown
): Promise<void> {
  await page.evaluate(
    ({ storageKey, value }: { storageKey: string; value: string }) => {
      localStorage.setItem(storageKey, value);
    },
    {
      storageKey: SUPPORT_PROMPT_STORAGE_KEY,
      value: JSON.stringify(state),
    }
  );
}

/** Visit training sets so dev seed runs on a fresh IndexedDB profile. */
export async function ensureDevTrainingDataSeeded(page: Page): Promise<void> {
  await page.goto("/app/sets");
  await page.getByRole("heading", { name: /training sets/i }).waitFor({
    timeout: 15_000,
  });
  await page
    .getByText(
      /no training sets|woodpecker easy|woodpecker intermediate|woodpecker advanced/i
    )
    .first()
    .waitFor({ timeout: 20_000 });
}

/** Ensures prompt milestone data exists (completed cycle in IndexedDB). */
export async function ensureCompletedCycleForPrompts(
  page: Page
): Promise<string> {
  await ensureDevTrainingDataSeeded(page);

  const existing = await getCompletedCycleId(page);
  if (existing) return existing;

  return page.evaluate(async () => {
    const openDb = () =>
      new Promise<IDBDatabase>((resolve, reject) => {
        const request = indexedDB.open("PatternForgeDB");
        request.onerror = () => reject(request.error);
        request.onsuccess = () => resolve(request.result);
      });

    const db = await openDb();
    const trainingSet = await new Promise<{ id: string } | undefined>(
      (resolve, reject) => {
        const tx = db.transaction("trainingSets", "readonly");
        const req = tx.objectStore("trainingSets").getAll();
        req.onerror = () => reject(req.error);
        req.onsuccess = () => {
          const sets = req.result as Array<{ id: string }>;
          resolve(sets[0]);
        };
      }
    );

    if (!trainingSet) return "";

    const id = crypto.randomUUID();
    const now = new Date().toISOString();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction("cycleRuns", "readwrite");
      const req = tx.objectStore("cycleRuns").add({
        id,
        trainingSetId: trainingSet.id,
        cycleNumber: 1,
        status: "completed",
        startedAt: now,
        completedAt: now,
        totalTimeMs: 60_000,
        solvedCount: 5,
        totalExercises: 5,
        nextExerciseIndex: 5,
      });
      req.onerror = () => reject(req.error);
      req.onsuccess = () => resolve();
    });

    return id;
  });
}

export async function getCompletedCycleId(page: Page): Promise<string> {
  return page.evaluate(async () => {
    const db = await new Promise<IDBDatabase>((resolve, reject) => {
      const request = indexedDB.open("PatternForgeDB");
      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result);
    });

    return new Promise<string>((resolve, reject) => {
      const tx = db.transaction("cycleRuns", "readonly");
      const store = tx.objectStore("cycleRuns");
      const request = store.getAll();
      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        const runs = request.result as Array<{ id: string; status: string }>;
        const completed = runs.find((run) => run.status === "completed");
        resolve(completed?.id ?? "");
      };
    });
  });
}

export async function assertNoHorizontalOverflow(page: Page): Promise<boolean> {
  return page.evaluate(() => {
    const doc = document.documentElement;
    return doc.scrollWidth <= doc.clientWidth + 1;
  });
}

export function isValidStripePaymentLink(href: string | null): boolean {
  return href != null && STRIPE_PAYMENT_LINK_PATTERN.test(href);
}
