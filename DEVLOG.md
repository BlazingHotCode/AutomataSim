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

## 2026-03-02 (Entry 2)

### DFA Simulation UI Integration

- Connected parsed Deterministic Finite Automaton definitions to `simulateDFA` in `src/App.tsx`.
- Added simulation input controls (`input string` + `Run`).
- Added simulation result output:
  - Accept/Reject status
  - final state
  - simulation/validation errors (when present)
- Added related simulation styles in `src/App.css`.
- Updated TODO to mark immediate Step 5 complete.

### TODO Clarification

- Added explicit Simulation UI task: `Allow simulating step by step.`
- Next immediate implementation target: TODO Step 6 (interactive step runner).

## 2026-03-02 (Entry 3)

### Interactive Step Runner

- Implemented interactive Deterministic Finite Automaton stepping in `src/App.tsx`.
- Added step state tracking (`activeStepIndex`) and controls:
  - `Previous`
  - `Next`
  - `Reset`
- Added step progress display (`current step / total steps`) and current state output.
- Added explicit step-by-step trace list with active-step highlighting.

### Graph Rendering Improvements for Simulation Clarity

- Enhanced `AutomatonGraph` to render simulation context directly on the diagram:
  - current state highlight
  - traversed states highlight
  - traversed transitions highlight
  - active transition highlight
- Added a graph legend in the UI to explain colors for:
  - current position
  - path taken
- Updated run behavior to start with the simulation path already visible at the final executed step.

### TODO Updates

- Marked completed:
  - `Allow simulating step by step.`
  - `Show step-by-step trace (current state after each symbol).`
  - Immediate Next Action `Step 6`.

## 2026-03-02 (Entry 4)

### `App.tsx` Modularization Refactor

- Refactored large UI sections out of `src/App.tsx` into focused components:
  - `src/components/AppHero.tsx`
  - `src/components/AutomatonEditorPanel.tsx`
  - `src/components/AutomatonVisualizationPanel.tsx`
- Updated `src/App.tsx` to act as an orchestration layer for state + handlers while delegating render blocks to the new components.
- Added shared handler helpers in `src/App.tsx` to reduce repeated per-automaton update logic:
  - `updateSelectedUiState`
  - `handleSimulationInputChange`
  - `handlePreviousStep`
  - `handleNextStep`
  - `handlePauseAutoPlay`
- Consolidated simulation panel props into a single `simulationPanelProps` object passed to the visualization component.
- Switched `App` declaration to `React.FC` typing for consistency with the extracted components.

### Validation Run

- Verified refactor with production build:
  - `npm run build` passed (`tsc -b` + `vite build`).
