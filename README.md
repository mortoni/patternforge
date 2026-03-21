# PatternForge

Local-first chess tactics training web app. Built for desktop and mobile, with future public deployment in mind.

## Architecture

- **Next.js (App Router)** – React framework with file-based routing.
- **Feature-first structure** – Code is organized by feature under `src/features/` (dashboard, training, session, training-sets, mistakes, analytics, settings). Each feature can have `components/`, `hooks/`, and `services/`.
- **Domain layer** – Entities and types live under `src/domain/` (training, session, mistakes, settings). No framework or DB details here.
- **Data layer** – IndexedDB via **Dexie** in `src/db/`. Repositories in `src/repositories/` encapsulate all Dexie access. Pages and UI do not touch Dexie directly; they use repositories and services.
- **Client-only Dexie** – Any code that imports or uses Dexie must run only on the client (e.g. components that use DB are `"use client"` or data is loaded in client components/hooks).

## Tech stack

- Next.js (latest), React, TypeScript
- Tailwind CSS, shadcn-style UI (Radix primitives, CVA, `cn` utility)
- Dexie + dexie-react-hooks
- Zod (schemas in `src/db/schema.ts`)
- chess.js, react-chessboard (for future puzzle UI)
- Recharts, date-fns
- Vitest, Testing Library, Playwright
- ESLint, Prettier

## Local-first approach

- All training data (sets, exercises, sessions, attempts, mistakes, settings) is stored in the browser via IndexedDB.
- No backend or auth in v1; the browser is the user context.

### IndexedDB schema and migrations

- The DB uses **Dexie versioning** (`src/db/dexie.ts`). Schema changes use new `version(n)` blocks; v2 adds a compound index `[trainingSetId+exerciseId]` on mistake entries for per-set uniqueness.
- **Migrations** (`src/db/migrations.ts`) run after `db.open()` (e.g. from AppShell). They are safe and idempotent; e.g. v2 backfills `Exercise.firstMove` from `solutionMoves[0]` when missing. User data is not wiped in normal operation.

### Loaders and side effects

- **Training loader** (`getActiveTrainingState`) is read-only: it loads set, cycle, and current exercise but does **not** create or update sessions. Session creation/reuse happens in the **interaction layer** (`useActiveTraining` hook) only when state is ready and the user is entering training.

### Empty sets

- Sets with **zero exercises** are a first-class state: no fake `totalExercises` (e.g. no `Math.max(1, exerciseCount)`). **Cycle creation is blocked** for empty sets; the UI shows "No exercises" / "No exercises yet" and disables Start Cycle. Detail page shows a clear empty state.

### Mistake uniqueness

- Mistake entries are unique per **(trainingSetId, exerciseId)**. The same exercise in two different sets yields two separate entries. Repository: `getByTrainingSetAndExercise(trainingSetId, exerciseId)`; recording uses this for create/update.

### Exercise ordering

- Exercise order is **guaranteed** by a single rule (`src/lib/training/exercise-order.ts`): if any exercise has `puzzleNumber`, sort by `puzzleNumber` ascending; otherwise sort by `createdAt` then `id`. Used consistently by the training loader and anywhere that resolves the current exercise by index.

### Seed data (development)

- **Training page** (`/app/training`) is a minimal Woodpecker-style surface: first-move solving and **Phase 3 progression** (attempts advance the cycle; correct increments `solvedCount`; incorrect/skip do not). A lightweight **active session** is created or reused per cycle; attempts are associated with it. **Phase 5 timing**: when a puzzle becomes active, an attempt start time is captured; when the user checks or skips, `durationMs` is computed and stored on the attempt and added to `Session.activeTimeMs`. When the cycle ends, the session is marked completed with `endedAt`. Timing is attempt-based (active solving time), not full wall-clock or pause-aware. Full solution-line validation is not yet implemented.
- **Training Sets page** (`/app/sets`) is the main library: list sets, start or continue a cycle, choose a set to train. On first load in development, it automatically runs a safe seed **only if no training sets exist**. The seed is **intentionally representative** for local development: **Lichess Mixed 1200–1600** (library: has exercises, no cycle), **Tournament Warmup** (completed cycle), **Rook Tactics** (empty set, no exercises).
- Seed is implemented in `src/db/seed-training-sets.ts` and invoked from the Training Sets page via `ensureSeededForDevelopment()`. It does **not** run in production.
- To **reset IndexedDB** during development: open DevTools → Application (Chrome) or Storage (Firefox) → IndexedDB → delete the `PatternForgeDB` database. Refresh the app and revisit `/app/sets` to re-seed.

## Puzzle Import Pipeline

The app can import a large dataset of chess puzzles from a CSV file and seed them into Dexie.

- **Canonical source:** `data/imports/puzzle.csv`
- **Expected columns:** `trainingSetId`, `puzzleNumber`, `fen`, `sideToMove`, `solutionMoves`, `motifTags`, `gameSource`, `difficulty`
- **Validation:** Rows are validated with Zod. `trainingSetId` and `difficulty` must be one of `easy` | `intermediate` | `advanced` and must match each other.

### How to validate

```bash
pnpm run validate:puzzles
```

Reads `data/imports/puzzle.csv` and prints validation errors with row numbers and a summary (total/valid/invalid and counts per set).

### How to generate JSON

```bash
pnpm run generate:puzzles
```

Converts the CSV to normalized JSON and writes to `data/generated/` and `public/data/generated/`:

- `easy-exercises.json`, `intermediate-exercises.json`, `advanced-exercises.json`
- `all-puzzles.json`
- `training-sets-meta.json`

Validation must pass (run `validate:puzzles` first or use `import:puzzles`).

### Full pipeline (validate + generate)

```bash
pnpm run import:puzzles
```

Validates the CSV, then generates all JSON files. Does **not** write to Dexie (Node has no IndexedDB). To load generated puzzles into the app, use the browser console: run `seedPuzzlesFromGeneratedJson()` from `@/db/seed-puzzles` (e.g. after building a small in-app loader or importing the module in the console). The generated files are written to `public/data/generated/` so they can be fetched at `/data/generated/` when the app is served.

### Resetting puzzle data in development

To clear only the puzzle-import sets (easy, intermediate, advanced) and their exercises, call `resetPuzzleDataForDevelopment()` from `@/db/seed-puzzles` in the browser console (dev only). To wipe all IndexedDB data, delete the `PatternForgeDB` database in DevTools → Application → IndexedDB.

### Resetting user progress (keeping the library)

To reset the app to a “fresh user” state **without** deleting training sets or exercises, use the **browser-only** reset utility. It clears cycles, sessions, attempts, mistakes, and app instance, and restores default settings (theme: system, board: white, no last training set). **Training sets and exercises are preserved.**

- **In development:** Open **Settings** (`/app/settings`). A dev-only card “Reset user progress (dev only)” appears at the bottom; use the button and confirm. Alternatively, in the browser console: `await window.resetUserProgress()` (available when the Settings page has been opened in dev at least once).
- **Programmatic:** Import and call `resetUserProgressPreserveLibrary()` from `@/services/reset-user-progress.service` or `@/db/reset-user-progress` in the browser. Returns a summary object (e.g. `cycleRunsDeleted`, `sessionsDeleted`, `settingsReset`).

This reset is **not** exposed in production UI. There is no Node script for it (IndexedDB is browser-only).

### Intended for larger datasets

The pipeline is designed so you can drop a large real `puzzle.csv` into `data/imports/`, run `pnpm run import:puzzles`, then load it in the app via the dev seed. A small sample CSV is included for local testing only.

## How to run

The project uses **pnpm** as the package manager.

```bash
pnpm install
pnpm run dev
```

Open [http://localhost:3000](http://localhost:3000). Use “Get started” / “Open app” to go to the app shell at `/app`.

### Scripts

- `pnpm run dev` – Start dev server
- `pnpm run build` – Production build
- `pnpm run start` – Start production server
- `pnpm run lint` – ESLint
- `pnpm run test` – Vitest (unit/integration)
- `pnpm run test:watch` – Vitest watch mode
- `pnpm run test:e2e` – Playwright E2E (starts dev server if needed). On first run, install browsers: `pnpm exec playwright install`
- `pnpm run validate:puzzles` – Validate `data/imports/puzzle.csv`
- `pnpm run generate:puzzles` – Convert CSV to JSON in `data/generated/` and `public/data/generated/`
- `pnpm run import:puzzles` – Validate + generate JSON (then seed in browser via dev button)

## Routes

- `/` – Marketing landing
- `/privacy`, `/terms` – Placeholder pages
- `/app` – **Dashboard (Phase 5)** – Shows real active training state when `lastTrainingSetId` has an active cycle: set name, cycle number, solved/total, progress bar, "Continue Training" and "View set" (links to set detail). **Quick stats** and **Recent sessions** list come from Dexie. If there are mistakes to review, a "Mistakes Remaining" card with "Review Mistakes" link is shown.
- `/app/training` – **Training page (Phase 3+5)** – Loads the current active exercise and gets/creates an active session. First-move solving: check persists attempt with real `durationMs` and (on incorrect/skip) records mistake; advancing the cycle happens in the minimal UI without a separate “Next puzzle” control. Cycle completion marks the session completed with `endedAt`. Timing is per-attempt; reload mid-puzzle resets the in-progress attempt timer.
- `/app/training/session-summary` – **Session summary** after a completed cycle; query `?sessionId=`. Legacy `/app/training-2` and `/app/training-2/session-summary` redirect here.
- `/app/session` – Start session
- `/app/sets` – **Training sets (Phase 6)** – Library/index of training sets. Each set name links to its detail page. Actions: Continue Training or Start Cycle 1 / Start Next Cycle. Filter by source and difficulty.
- `/app/sets/[trainingSetId]` – **Training set detail (Phase 6)** – Set metadata (name, description, source, difficulty, tags), summary cards (exercises, status, progress, completed cycles, total time), primary action (Continue / Start Cycle 1 / Start Next Cycle), active cycle panel when applicable, and **cycle history** table (desktop) or list (mobile). Handles not found, no exercises, and no cycles yet. TODO: import pipeline does not yet populate `source`/`tags`; seed data includes example metadata.
- `/app/mistakes` – **Mistakes Review (Phase 4)** – List of active mistakes (status ≠ mastered) with summary cards. Open a mistake to review: first-move solving same as training; correct advances mastery (needs_review → solved_once → solved_twice → mastered); incorrect resets to needs_review; skip keeps needs_review. Mastered items disappear from the list. Route `/app/mistakes/[mistakeId]` for the review flow.
- `/app/analytics` – **Analytics (Phase 5)** – Real page backed by Dexie: summary cards (total sessions, attempts, overall accuracy, total training time), **Session duration over time** bar chart, **Accuracy over time** bar chart. Data is local and repository-driven. Future phases may add pause-aware timing and deeper reporting.
- `/app/settings` – **Settings (Phase 7)** – Functional preferences page. **Theme**: light, dark, or system (persisted in AppSettings, applied app-wide via class on `html`). **Board orientation**: white or black (persisted; used by the training page and mistake review page). Training preferences section is scaffolded for future options. Dev-only “Reset user progress” card appears at the bottom in development.

## Key directories

- `src/app/` – Next.js routes and layouts
- `src/components/ui/` – Reusable UI (Button, Card)
- `src/components/shared/` – PageHeader, PlaceholderCard, EmptyState, SidebarNav, StatCard, AppShell
- `src/features/*/` – Feature-specific components and shells
- `src/domain/` – Entity types and domain types
- `src/db/` – Dexie setup, schema (Zod), migrations, seed
- `src/repositories/` – Dexie table access
- `src/services/` – puzzle-evaluator (first-move compare), mistake-review, cycle-progress, training-session, analytics (dashboard stats, recent sessions, chart series)
- `src/lib/` – utils, constants, ids, dates, csv, puzzle-import
- `data/imports/` – canonical `puzzle.csv` for the import pipeline
- `data/generated/` – generated JSON (also copied to `public/data/generated/` for in-browser fetch)
- `scripts/` – validate-puzzles, generate-puzzle-json, import-puzzles (Node)
