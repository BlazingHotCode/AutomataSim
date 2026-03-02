import type {
  DeterministicSimulationResult,
  NondeterministicSimulationResult,
} from './automaton'

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

export interface NondeterministicUiState {
  definitionText: string
  inputString: string
  simulationResult: NondeterministicSimulationResult | null
  activeStepIndex: number
  isAutoPlaying: boolean
}

export interface PlannedUiState {
  definitionText: string
}

export type UiStateByType = {
  deterministicFiniteAutomaton: DeterministicUiState
  nondeterministicFiniteAutomaton: NondeterministicUiState
  pushdownAutomaton: PlannedUiState
  queueAutomaton: PlannedUiState
  turingMachine: PlannedUiState
}

export interface PersistedUiConfig {
  selectedAutomatonType: AutomatonType
  definitionsByType: Record<AutomatonType, string>
  deterministicInputString: string
  nondeterministicInputString: string
}
