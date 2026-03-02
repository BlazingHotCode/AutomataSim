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

export interface PushdownSimulationStep {
  index: number
  inputSymbol: SymbolToken
  fromState: StateId
  toState: StateId
  popSymbol: SymbolToken
  pushSymbols: SymbolToken[]
  stackBefore: SymbolToken[]
  stackAfter: SymbolToken[]
}

export interface PushdownSimulationResult {
  accepted: boolean
  inputSymbols: SymbolToken[]
  startState: StateId
  finalState: StateId
  trace: PushdownSimulationStep[]
  errors: string[]
}

export type TuringHeadMove = 'L' | 'R' | 'S'

export interface TuringTransition {
  from: StateId
  readSymbol: SymbolToken
  to: StateId
  writeSymbol: SymbolToken
  move: TuringHeadMove
}

export interface TuringMachine {
  states: StateId[]
  alphabet: SymbolToken[]
  tapeAlphabet: SymbolToken[]
  blankSymbol: SymbolToken
  startState: StateId
  acceptStates: StateId[]
  transitions: TuringTransition[]
}

export interface TuringSimulationStep {
  index: number
  fromState: StateId
  toState: StateId
  readSymbol: SymbolToken
  writeSymbol: SymbolToken
  move: TuringHeadMove
  headBefore: number
  headAfter: number
  tapeBefore: SymbolToken[]
  tapeAfter: SymbolToken[]
}

export interface TuringSimulationResult {
  accepted: boolean
  inputSymbols: SymbolToken[]
  startState: StateId
  finalState: StateId
  trace: TuringSimulationStep[]
  haltedReason: 'accept' | 'reject' | 'step_limit'
  errors: string[]
}

export interface QueueTransition {
  from: StateId
  inputSymbol: SymbolToken
  dequeueSymbol: SymbolToken
  to: StateId
  enqueueSymbol: SymbolToken
}

export interface QueueAutomaton {
  states: StateId[]
  alphabet: SymbolToken[]
  queueAlphabet: SymbolToken[]
  queueStartSymbol: SymbolToken
  startState: StateId
  acceptStates: StateId[]
  transitions: QueueTransition[]
}

export interface QueueSimulationStep {
  index: number
  inputSymbol: SymbolToken
  fromState: StateId
  toState: StateId
  dequeueSymbol: SymbolToken
  enqueueSymbol: SymbolToken
  queueBefore: SymbolToken[]
  queueAfter: SymbolToken[]
}

export interface QueueSimulationResult {
  accepted: boolean
  inputSymbols: SymbolToken[]
  startState: StateId
  finalState: StateId
  trace: QueueSimulationStep[]
  errors: string[]
}
