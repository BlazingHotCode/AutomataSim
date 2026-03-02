# AutomataSim

AutomataSim is a React + TypeScript web app for defining and visualizing finite automata, starting with Deterministic Finite Automaton workflows through a text-based definition format.

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

## Deployment Troubleshooting

- If the site 404s at the root URL:
  - Confirm repository Pages is enabled and publishing from branch `gh-pages` (root).
- If assets load as 404 after deploy:
  - Confirm Vite `base` is `/AutomataSim/` in `vite.config.ts`.
- If deploy workflow fails:
  - Check Actions logs for `pnpm install` or `pnpm build` errors.
  - Ensure `GITHUB_TOKEN` has permissions to push `gh-pages` (workflow sets `contents: write`).
- If workflow succeeds but website is stale:
  - Confirm latest commit exists on `gh-pages`.
  - Hard-refresh browser cache.
