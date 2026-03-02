# AutomataSim

AutomataSim is a React + TypeScript web app for building and simulating finite automata, starting with DFA-focused workflows.

## Local Development

1. Install dependencies:
   - `pnpm install`
2. Start dev server:
   - `pnpm dev`
3. Build production bundle:
   - `pnpm build`
4. Run lint checks:
   - `pnpm lint`

## Deployment

This repo deploys automatically to GitHub Pages via [`.github/workflows/deploy.yml`](/home/blazinghg/Documents/Coding/AutomataSim/.github/workflows/deploy.yml) on every push to `main`.

- Build output: `dist/`
- Published branch: `gh-pages`
- Vite base path: `/AutomataSim/` (configured in `vite.config.ts`)

Expected URL format:
- `https://<github-username>.github.io/AutomataSim/`
