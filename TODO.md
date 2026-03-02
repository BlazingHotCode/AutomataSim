# AutomataSim TODO

Use this as a step-by-step build plan. Check items off as you complete them.

## 1. Project Foundation

- [x] Confirm local setup works: `pnpm install`, `pnpm dev`, `pnpm build`, `pnpm lint`.
- [x] Replace starter React/Vite UI in `src/App.tsx` with a clean app shell.
- [x] Define a minimal folder structure for growth:
  - 1.3.1 `src/components/`
  - 1.3.2 `src/lib/` (automata logic)
  - 1.3.3 `src/types/`
- [x] Add core project docs to `README.md`:
  - 1.4.1 what AutomataSim does
  - 1.4.2 how to run locally
  - 1.4.3 how to deploy

## 2. Scope Definition (MVP)

- [x] Decide first automaton type to support:
  - 2.1.1 Deterministic Finite Automaton only for MVP.
- [x] Write MVP feature list (short and strict):
  - 2.2.1 state creation/removal
  - 2.2.2 transition creation/removal
  - 2.2.3 start state selection
  - 2.2.4 accepting state selection
  - 2.2.5 input string simulation
- [x] Define out-of-scope items for now:
  - 2.3.1 Nondeterministic Finite Automaton support
  - 2.3.2 Pushdown Automaton support
  - 2.3.3 Turing Machine support
  - 2.3.4 Queue Automaton support
  - 2.3.5 advanced animations
  - 2.3.6 authentication
- [x] Define post-MVP automata expansion plan (planning only, not implementation):
  - 2.4.1 Nondeterministic Finite Automaton
    - Phase 1: add Nondeterministic Finite Automaton types + parser mode.
    - Phase 2: implement epsilon-closure based simulation and trace output.
    - Phase 3: render multiple active states during simulation.
  - 2.4.2 Pushdown Automaton
    - Phase 1: extend model with stack alphabet, stack start symbol, and transitions with push/pop actions.
    - Phase 2: implement step simulation with stack snapshots per step.
    - Phase 3: add stack visualization panel alongside state graph.
  - 2.4.3 Turing Machine
    - Phase 1: extend model with tape alphabet, blank symbol, and head move actions (L/R/Stay).
    - Phase 2: implement bounded execution engine with halt/step limit safeguards.
    - Phase 3: add tape/head visualization and execution controls.
  - 2.4.4 Queue Automaton
    - Phase 1: extend model with queue alphabet and enqueue/dequeue transition actions.
    - Phase 2: implement deterministic simulation with queue snapshots per step.
    - Phase 3: add queue visualization panel and playback controls.

## 2A. Post-MVP Implementation Backlog (Not Done)

- [ ] 2A.1 Implement Nondeterministic Finite Automaton
  - [ ] 2A.1.1 Add types + parser mode.
  - [ ] 2A.1.2 Implement epsilon-closure simulation + trace.
  - [ ] 2A.1.3 Add renderer support for multiple active states.
  - [ ] 2A.1.4 Add engine and parser tests.
- [ ] 2A.2 Implement Pushdown Automaton
  - [ ] 2A.2.1 Add model for stack alphabet and push/pop transitions.
  - [ ] 2A.2.2 Implement step simulation with stack snapshots.
  - [ ] 2A.2.3 Add stack UI visualization.
  - [ ] 2A.2.4 Add engine and parser tests.
- [ ] 2A.3 Implement Turing Machine
  - [ ] 2A.3.1 Add tape/head model + parser mode.
  - [ ] 2A.3.2 Implement execution engine with halt/step safeguards.
  - [ ] 2A.3.3 Add tape/head visualization and controls.
  - [ ] 2A.3.4 Add engine and parser tests.
- [ ] 2A.4 Implement Queue Automaton
  - [ ] 2A.4.1 Add queue model + parser mode.
  - [ ] 2A.4.2 Implement queue transition simulation with snapshots.
  - [ ] 2A.4.3 Add queue visualization and playback controls.
  - [ ] 2A.4.4 Add engine and parser tests.

## 3. Data Model and Engine

- [x] Create TypeScript types for:
  - 3.1.1 state id/name
  - 3.1.2 alphabet symbols
  - 3.1.3 transitions
  - 3.1.4 automaton definition
  - 3.1.5 simulation result (accept/reject + trace)
- [x] Implement pure logic functions in `src/lib/`:
  - 3.2.1 validation (valid start state, transitions, alphabet)
  - 3.2.2 `simulateDFA(automaton, input)` for Deterministic Finite Automaton simulation
  - 3.2.3 optional `simulateNFA` for Nondeterministic Finite Automaton simulation (deferred until scope expands)
- [x] Add unit tests for engine behavior:
  - 3.3.1 accepts valid strings
  - 3.3.2 rejects invalid strings
  - 3.3.3 handles missing transitions safely

## 4. Editor UI

- [x] Build a text-based automaton definition input panel.
- [x] Parse text input into a Deterministic Finite Automaton model.
- [x] Validate text input and show explicit parse/validation errors.
- [x] Render parsed automaton as a state/transition diagram.
- [x] Replace fixed/circular node layout with connection-aware positioning based on graph structure.
- [x] Keep UI state normalized so it maps 1:1 to automaton types.

## 5. Simulation UI

- [x] Add input string field and Run button.
- [x] Show result clearly: Accept / Reject.
- [x] Allow simulating step by step.
- [x] Show step-by-step trace (current state after each symbol).
- [x] Add playback controls for simulation walkthrough:
  - 5.4.1 next step
  - 5.4.2 previous step
  - 5.4.3 auto-play
  - 5.4.4 pause/reset
- [x] Add reset/clear actions.
- [x] Handle invalid machine configs with explicit error messages.

## 6. Persistence and Sharing (Optional but useful)

- [x] Save/load machine config to `localStorage`.
- [x] Add import/export JSON for automata definitions.
- [x] Validate imported JSON and show useful errors.

## 7. Quality and Tooling

- [x] Add a test runner (Vitest recommended) and scripts:
  - 7.1.1 `test`
  - 7.1.2 `test:watch`
- [x] Add CI checks (build + lint + test) on pull requests.
- [x] Enforce formatting/lint consistency (ESLint already present; add Prettier if desired).
- [x] Add lightweight error boundary for runtime UI crashes.
- [x] Split `src/App.tsx` into multiple files/components (graph rendering, simulation controls, import/export logic, and shared state helpers).
- [x] Refactor code into modular, reusable units (components, parsing utilities, simulation hooks, shared types).

## 8. GitHub Pages Deploy Hardening

- [x] Keep `vite.config.ts` base path synced with repo name (`/AutomataSim/`).
- [ ] Verify deploy workflow succeeds on `main` pushes.
- [ ] Confirm app loads correctly from `https://<username>.github.io/AutomataSim/`.
- [x] Add deployment troubleshooting notes to `README.md`.

## 9. Immediate Next Actions

- [x] Step 1: Replace starter `App.tsx` with a minimal AutomataSim layout.
- [x] Step 2: Create `src/types/automaton.ts`.
- [x] Step 3: Implement `simulateDFA` in `src/lib/simulateDFA.ts`.
- [x] Step 4: Render a text-based input to define states/transitions/string.
- [x] Step 5: Connect form data to `simulateDFA` and show accept/reject result for the Deterministic Finite Automaton.
- [x] Step 6: Add interactive step runner so users can walk through transitions from input start to end.
