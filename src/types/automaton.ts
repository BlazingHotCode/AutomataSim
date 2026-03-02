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

export interface PushdownTransition {
  from: StateId
  inputSymbol: SymbolToken
  popSymbol: SymbolToken
  to: StateId
  pushSymbols: SymbolToken[]
}

export interface PushdownAutomaton {
  states: StateId[]
  alphabet: SymbolToken[]
  stackAlphabet: SymbolToken[]
  startState: StateId
  acceptStates: StateId[]
  stackStartSymbol: SymbolToken
  transitions: PushdownTransition[]
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

export interface NondeterministicSimulationStep {
  index: number
  symbol: SymbolToken
  fromStates: StateId[]
  toStates: StateId[]
}

export interface NondeterministicSimulationResult {
  accepted: boolean
  inputSymbols: SymbolToken[]
  startStates: StateId[]
  finalStates: StateId[]
  trace: NondeterministicSimulationStep[]
  errors: string[]
}
