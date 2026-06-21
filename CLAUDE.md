# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm install       # Install dependencies
npm run dev       # Start dev server at http://localhost:3000 (opens browser automatically)
npm run build     # Build to ./build/
```

There are no test commands — this project has no test suite.

## Architecture

This is a single-page React + Vite + TypeScript app. All game logic lives in `src/App.tsx` — there are no routing, state management libraries, or backend. The app is entirely client-side.

**Game logic (`src/App.tsx`):** Three treasure boxes are rendered, one randomly assigned the treasure at `initializeGame()`. Clicking a box calls `openBox()`, which updates score (+100 for treasure, -50 for skeleton) and sets `gameEnded` when the treasure is found or all boxes are opened. Animations use `motion/react`. When a logged-in user finishes a game, the score is auto-saved via the db layer.

**Auth & database (`src/lib/db.ts`, `src/components/AuthModal.tsx`):** SQLite runs in-browser via `sql.js` (WASM binary at `public/sql-wasm.wasm`). The database is serialized to `localStorage` after every write (`persist()`). Passwords are hashed with `crypto.subtle` (SHA-256). `AuthModal` wraps login/register in a tabbed Radix Dialog. Guest mode is fully supported — no data is stored unless the user logs in.

**UI components (`src/components/ui/`):** A large set of pre-built Radix UI + shadcn-style components. The game itself uses `Button`, `Dialog`, `Tabs`, `Input`, and `Label` — the rest are available for extension.

**Assets:**
- `src/assets/` — chest images (closed, opened with treasure, opened with skeleton) and `key.png` (used as the custom cursor on hover)
- `src/audios/` — sound effects (`chest_open.mp3`, `chest_open_with_evil_laugh.mp3`)
- `src/results/` — additional images (e.g., `key_hover.png`)
- `public/sql-wasm.wasm` — required by sql.js; must be served at the root path

**Path alias:** `@` resolves to `src/` (configured in `vite.config.ts`).

**Build output:** Vite outputs to `./build/` (not the default `./dist/`).

**`vite.config.ts` aliases:** In addition to `@`, the config includes versioned aliases (e.g., `'lucide-react@0.487.0': 'lucide-react'`) — these are generated shims; do not remove them.

**`src/components/figma/ImageWithFallback.tsx`:** A drop-in `<img>` replacement that renders a placeholder SVG on load error — use it when displaying images that may fail to load.

**`src/guidelines/Guidelines.md`:** A blank template for project-specific design and coding guidelines. Add rules there to keep them out of CLAUDE.md.
