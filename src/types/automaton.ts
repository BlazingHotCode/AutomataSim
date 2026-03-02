export type StateId = string
export type SymbolToken = string

export interface DeterministicTransition {
  from: StateId
  symbol: SymbolToken
  to: StateId
}

export interface DeterministicFiniteAutomaton {
  states: StateId[]
  alphabet: SymbolToken[]
  startState: StateId
  acceptStates: StateId[]
  transitions: DeterministicTransition[]
}

export interface ParseResult<T> {
  value: T | null
  errors: string[]
}
