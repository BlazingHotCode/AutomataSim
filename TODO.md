# AutomataSim TODO

Use this as a step-by-step build plan. Check items off as you complete them.

## 1. Project Foundation

- [x] Confirm local setup works: `pnpm install`, `pnpm dev`, `pnpm build`, `pnpm lint`.
- [x] Replace starter React/Vite UI in `src/App.tsx` with a clean app shell.
- [x] Define a minimal folder structure for growth:
  - `src/components/`
  - `src/lib/` (automata logic)
  - `src/types/`
- [x] Add core project docs to `README.md`:
  - what AutomataSim does
  - how to run locally
  - how to deploy

## 2. Scope Definition (MVP)

- [x] Decide first automaton type to support:
  - Deterministic Finite Automaton only for MVP.
- [x] Write MVP feature list (short and strict):
  - state creation/removal
  - transition creation/removal
  - start state selection
  - accepting state selection
  - input string simulation
- [x] Define out-of-scope items for now:
  - Nondeterministic Finite Automaton support
  - Pushdown Automaton support
  - Turing Machine support
  - advanced animations
  - authentication

## 3. Data Model and Engine

- [x] Create TypeScript types for:
  - state id/name
  - alphabet symbols
  - transitions
  - automaton definition
  - simulation result (accept/reject + trace)
- [ ] Implement pure logic functions in `src/lib/`:
  - validation (valid start state, transitions, alphabet)
  - `simulateDFA(automaton, input)` for Deterministic Finite Automaton simulation
  - optional `simulateNFA` for Nondeterministic Finite Automaton simulation (if scope expands)
- [ ] Add unit tests for engine behavior:
  - accepts valid strings
  - rejects invalid strings
  - handles missing transitions safely

## 4. Editor UI

- [x] Build a text-based automaton definition input panel.
- [x] Parse text input into a Deterministic Finite Automaton model.
- [x] Validate text input and show explicit parse/validation errors.
- [x] Render parsed automaton as a state/transition diagram.
- [ ] Keep UI state normalized so it maps 1:1 to automaton types.

## 5. Simulation UI

- [ ] Add input string field and Run button.
- [ ] Show result clearly: Accept / Reject.
- [ ] Show step-by-step trace (current state after each symbol).
- [ ] Add reset/clear actions.
- [ ] Handle invalid machine configs with explicit error messages.

## 6. Persistence and Sharing (Optional but useful)

- [ ] Save/load machine config to `localStorage`.
- [ ] Add import/export JSON for automata definitions.
- [ ] Validate imported JSON and show useful errors.

## 7. Quality and Tooling

- [ ] Add a test runner (Vitest recommended) and scripts:
  - `test`
  - `test:watch`
- [ ] Add CI checks (build + lint + test) on pull requests.
- [ ] Enforce formatting/lint consistency (ESLint already present; add Prettier if desired).
- [ ] Add lightweight error boundary for runtime UI crashes.

## 8. GitHub Pages Deploy Hardening

- [x] Keep `vite.config.ts` base path synced with repo name (`/AutomataSim/`).
- [ ] Verify deploy workflow succeeds on `main` pushes.
- [ ] Confirm app loads correctly from `https://<username>.github.io/AutomataSim/`.
- [ ] Add deployment troubleshooting notes to `README.md`.

## 9. Immediate Next Actions

- [x] Step 1: Replace starter `App.tsx` with a minimal AutomataSim layout.
- [x] Step 2: Create `src/types/automaton.ts`.
- [ ] Step 3: Implement `simulateDFA` in `src/lib/simulateDFA.ts`.
- [x] Step 4: Render a text-based input to define states/transitions/string.
- [ ] Step 5: Connect form data to `simulateDFA` and show accept/reject result for the Deterministic Finite Automaton.
