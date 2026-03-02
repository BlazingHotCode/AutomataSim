export type StateId = string
export type SymbolToken = string

export interface DeterministicTransition {
  from: StateId
  symbol: SymbolToken
  to: StateId
}

export interface NondeterministicTransition {
  from: StateId
  symbol: SymbolToken
  to: StateId[]
}

export interface DeterministicFiniteAutomaton {
  states: StateId[]
  alphabet: SymbolToken[]
  startState: StateId
  acceptStates: StateId[]
  transitions: DeterministicTransition[]
}

export interface NondeterministicFiniteAutomaton {
  states: StateId[]
  alphabet: SymbolToken[]
  startState: StateId
  acceptStates: StateId[]
  transitions: NondeterministicTransition[]
}

export interface ParseResult<T> {
  value: T | null
  errors: string[]
}

export interface ValidationResult {
  isValid: boolean
  errors: string[]
}

export interface DeterministicSimulationStep {
  index: number
  symbol: SymbolToken
  fromState: StateId
  toState: StateId
}

export interface DeterministicSimulationResult {
  accepted: boolean
  inputSymbols: SymbolToken[]
  startState: StateId
  finalState: StateId
  trace: DeterministicSimulationStep[]
  errors: string[]
}
