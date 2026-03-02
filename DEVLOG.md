# Dev Log

## 2026-03-02

### Project Setup and Foundation

- Initialized project foundation tasks from TODO Section 1.
- Replaced starter Vite/React counter UI with an AutomataSim shell.
- Added base project documentation and local/deploy instructions in `README.md`.
- Created base source structure:
  - `src/components/`
  - `src/lib/`
  - `src/types/`

### CI / Deployment Fix

- Investigated GitHub Actions failure at `actions/setup-node@v4` with pnpm cache.
- Root cause: `pnpm-workspace.yaml` existed without a required `packages` field.
- Fix applied:
  - Added:
    - `packages:`
    - `- .`
- Verified command success locally:
  - `pnpm store path --silent`
  - `pnpm install --frozen-lockfile`

### Scope and Terminology

- Completed TODO Section 2 (MVP scope definition).
- Set MVP automaton scope to Deterministic Finite Automaton only.
- Standardized wording to use full automata names instead of acronyms in TODO/app text.

### Text-Based Automaton Input + Rendering

- Switched approach from field-by-field editor to text-based automaton definition input.
- Added new types in `src/types/automaton.ts`.
- Added parser/validator in `src/lib/parseAutomaton.ts`:
  - Parses `states`, `alphabet`, `start`, `accept`, and `transitions`.
  - Validates missing sections, invalid references, duplicates, and transition format.
- Rebuilt UI in `src/App.tsx`:
  - Textarea input for definition.
  - Live parse error output.
  - SVG rendering of states and transitions.
  - Start arrow and accepting-state double-circle rendering.
- Added supporting styles in `src/App.css`.

### Validation Runs

- `pnpm install` passed
- `pnpm dev` started successfully
- `pnpm lint` passed
- `pnpm build` passed

### Next Planned Work

- Implement Deterministic Finite Automaton simulation engine (`simulateDFA`).
- Add input string execution (accept/reject + step trace).
