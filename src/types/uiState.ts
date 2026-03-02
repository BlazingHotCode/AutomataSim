import type { DeterministicSimulationResult } from './automaton'

export type AutomatonType =
  | 'deterministicFiniteAutomaton'
  | 'nondeterministicFiniteAutomaton'
  | 'pushdownAutomaton'
  | 'queueAutomaton'
  | 'turingMachine'

export interface AutomatonOption {
  id: AutomatonType
  label: string
  supported: boolean
}

export interface DeterministicUiState {
  definitionText: string
  inputString: string
  simulationResult: DeterministicSimulationResult | null
  activeStepIndex: number
  isAutoPlaying: boolean
}

export interface PlannedUiState {
  definitionText: string
}

export type UiStateByType = {
  deterministicFiniteAutomaton: DeterministicUiState
  nondeterministicFiniteAutomaton: PlannedUiState
  pushdownAutomaton: PlannedUiState
  queueAutomaton: PlannedUiState
  turingMachine: PlannedUiState
}

export interface PersistedUiConfig {
  selectedAutomatonType: AutomatonType
  definitionsByType: Record<AutomatonType, string>
  deterministicInputString: string
}
