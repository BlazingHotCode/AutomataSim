import type {
  DeterministicSimulationResult,
  NondeterministicSimulationResult,
  PushdownSimulationResult,
  QueueSimulationResult,
  TuringSimulationResult,
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

export interface PushdownUiState {
  definitionText: string
  inputString: string
  simulationResult: PushdownSimulationResult | null
  activeStepIndex: number
  isAutoPlaying: boolean
}

export interface QueueUiState {
  definitionText: string
  inputString: string
  simulationResult: QueueSimulationResult | null
  activeStepIndex: number
  isAutoPlaying: boolean
}

export interface TuringUiState {
  definitionText: string
  inputString: string
  simulationResult: TuringSimulationResult | null
  activeStepIndex: number
  isAutoPlaying: boolean
}

export interface PlannedUiState {
  definitionText: string
}

export type UiStateByType = {
  deterministicFiniteAutomaton: DeterministicUiState
  nondeterministicFiniteAutomaton: NondeterministicUiState
  pushdownAutomaton: PushdownUiState
  queueAutomaton: QueueUiState
  turingMachine: TuringUiState
}

export interface PersistedUiConfig {
  selectedAutomatonType: AutomatonType
  definitionsByType: Record<AutomatonType, string>
  deterministicInputString: string
  nondeterministicInputString: string
  pushdownInputString: string
  queueInputString: string
  turingInputString: string
}
