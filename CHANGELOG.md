# Changelog

All notable changes to PatternForge are documented here.

The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and
this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).
While the version stays below `1.0.0`, minor releases may change defaults.

## [0.2.0] — 2026-07-23

First tracked release. Covers everything since `0.1.0`: offline support, a
readable-by-default board, and a pass over correctness in the training loop.

### Added

- **Offline support.** A service worker (Serwist) precaches the app shell and the
  Woodpecker puzzle bundles, so an installed app opens and trains without a
  connection. Previously the app advertised offline support but shipped no
  service worker, and opening it offline showed a browser error page. Routes you
  have not visited fall back to a branded offline page.
- **Mistakes Review in the sidebar**, with a live badge counting mistakes still
  in the review ladder. The feature previously existed but was reachable only by
  typing the URL.
- **"Show solution" toggle in mistake review.** The annotated solution line used
  to sit beside the board before you retried the puzzle, which gave the answer
  away. It is now behind a disclosure and reveals itself once you have answered.
- **Woodpecker bundles are validated on read.** A malformed or truncated bundle
  now fails loudly instead of seeding corrupt exercises, using the same schema
  the `validate:woodpecker` CLI checks.

### Changed

- **The default board is now Classic (Lichess).** The previous default —
  Blueprint — used near-black squares whose move dots, selection and coordinates
  were hard to read. Blueprint remains available and has been given legible move
  chrome, lifted squares and readable coordinates.
- **The board is oriented to the side solving the puzzle** by default, instead of
  always from White. Explicit White/Black remain available in Settings.
- **The training library seeds from the app shell**, so deep-linking to
  `/app/progress` or `/app/mistakes` on a first visit no longer shows an empty
  app. Seeding previously ran only when the Training Sets page mounted.
- **Mistake-review commentary is fully readable.** Source notes were clipped to a
  fixed height with no way to see the rest; most bundled notes are longer than
  that box. They now scroll, and the region is keyboard reachable.
- **Training Sets table**: bundled sets report their source as "Woodpecker"
  rather than the misleading "Custom", and the always-empty Tags column is gone.
- Smaller interface fixes: the sidebar wordmark no longer truncates, "Skip" meets
  a 44px touch target on mobile, and Progress hides the average/longest session
  stats until there is more than one session to compare.

### Fixed

- **Failed saves are no longer silent.** If persisting a move or skip failed
  (private browsing, storage full), the move quietly disappeared and the attempt
  was never recorded. The board now rolls back and explains what happened.
- **Attempt writes are atomic.** Resolving a puzzle performed several sequential
  writes with no transaction, so an interruption could record an attempt without
  advancing the cycle. They now commit together or not at all.
- **A hydration mismatch on the Settings page**, caused by board-style previews
  computing their colours from the client theme.
- **A latent Chessground trap** that could leave the board unresponsive: it skips
  binding pointer handlers when redrawn in view-only mode, and never rebinds
  them. A paused board is no longer marked view-only, so no redraw can strand it.

### Internal

- The training solve flow is now an explicit reducer state machine with a single
  timer owner, replacing roughly ten mutable refs and three hand-cleared timers.
- Test coverage added for offline behaviour (a suite that runs against a
  production build), bundle validation, and the app-shell precache list.
- Dropped an unused font from first paint, trimmed always-on `will-change` from
  marketing previews, removed dead files, and cleared all lint warnings.
- Documented that the board is pointer-driven, so there is currently no keyboard
  path to make a move — the surrounding UI is reachable, but the solving loop is
  not.

## [0.1.0]

Initial local-first training application: Woodpecker training sets, repetition
cycles, session tracking, mistake review, progress reporting, and settings.
