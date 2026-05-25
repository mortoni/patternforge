# PatternForge

Train patterns. Build recognition.

A local-first tactical chess training system built around repetition and pattern recognition.

[Live App](https://chessforge.app) • [Documentation](https://main--6a09a2c2e687bd342f4777e5.chromatic.com/?path=/docs/introduction--docs) • [License](./LICENSE)

## What Is PatternForge?

PatternForge is a deliberate tactical training system inspired by the Woodpecker Method.

Instead of endlessly consuming new puzzles, PatternForge focuses on structured repetition cycles designed to improve long-term tactical recognition and recall.

The goal is not only to solve positions.

The goal is to recognize them faster over time.

### Core Ideas

- Repetition builds recognition
- Recognition reduces calculation load
- Familiarity increases tactical speed
- Consistency matters more than puzzle volume
- Training should feel focused, not noisy

---

## Technical Overview

PatternForge is designed as a local-first web application with a strong focus on UX continuity, responsiveness, and deliberate interaction design.

### Architecture Highlights

- Local-first persistence using IndexedDB
- Offline-capable/PWA-first experience
- Structured training cycle workflows
- Stateful training and reflection flows
- Mobile-focused interaction design
- Strong TypeScript-first architecture
- Component-driven UI development
- Automated testing and documentation workflows

### Engineering Principles

- Local-first architecture
- UX continuity
- Deliberate interaction design
- Disciplined frontend engineering
- Architecture serving cognition

### Stack

- Next.js
- React
- TypeScript
- Dexie
- Tailwind CSS
- shadcn/ui
- chess.js
- react-chessboard
- Playwright
- Storybook / Chromatic

---

## Documentation

Handbook and UI docs live in Storybook on Chromatic ([branch permalinks](https://www.chromatic.com/docs/permalinks/) — always the latest publish on `main`):

- [Introduction](https://main--6a09a2c2e687bd342f4777e5.chromatic.com/?path=/docs/introduction--docs)
- [Development Guides](https://main--6a09a2c2e687bd342f4777e5.chromatic.com/?path=/docs/development-guides-getting-started--docs)
- [Architecture](https://main--6a09a2c2e687bd342f4777e5.chromatic.com/?path=/docs/architecture-overview--docs)

---

## Contributing

PatternForge is open source under GPL-3.0.

Contributions, ideas, bug reports, and discussions are welcome.

Before contributing:

1. Read the documentation
2. Keep changes focused and intentional
3. Preserve the local-first and UX-first design principles
4. Prefer clarity and maintainability over abstraction

---

## Getting Started

```bash
pnpm install
pnpm dev
```

Then open:

```bash
http://localhost:3000
```

### Useful Commands

```bash
pnpm test
pnpm lint
pnpm typecheck
pnpm storybook
```

---

## Future Direction

PatternForge is actively evolving with ongoing work around:

- training workflows
- reflection and mastery systems
- mobile/PWA experience
- accessibility improvements
- tactical set expansion
- deeper training analytics

The long-term goal is to build a focused and thoughtfully engineered tactical training experience centered around recognition and deliberate practice.

---

## License

GPL-3.0
