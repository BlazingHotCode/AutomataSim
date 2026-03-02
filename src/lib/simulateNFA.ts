import type {
  NondeterministicFiniteAutomaton,
  NondeterministicSimulationResult,
  StateId,
  SymbolToken,
} from '../types/automaton'
import { validateNondeterministicFiniteAutomaton } from './validateAutomaton'

const EPSILON_SYMBOLS = new Set(['ε', 'epsilon', 'eps', 'e'])

function isEpsilonSymbol(symbol: string): boolean {
  return EPSILON_SYMBOLS.has(symbol)
}

function toInputSymbols(input: string | SymbolToken[]): SymbolToken[] {
  if (Array.isArray(input)) {
    return input
  }

  const trimmed = input.trim()
  if (trimmed.length === 0) {
    return []
  }

  if (trimmed.includes(' ')) {
    return trimmed.split(/\s+/).filter((symbol) => symbol.length > 0)
  }

  return trimmed.split('')
}

function epsilonClosure(
  startStates: Iterable<StateId>,
  epsilonTargetsByState: Map<StateId, Set<StateId>>,
): Set<StateId> {
  const closure = new Set<StateId>()
  const queue: StateId[] = []

  for (const state of startStates) {
    if (!closure.has(state)) {
      closure.add(state)
      queue.push(state)
    }
  }

  while (queue.length > 0) {
    const state = queue.shift()!
    const epsilonTargets = epsilonTargetsByState.get(state) ?? new Set<StateId>()
    for (const target of epsilonTargets) {
      if (!closure.has(target)) {
        closure.add(target)
        queue.push(target)
      }
    }
  }

  return closure
}

function sortStates(states: Iterable<StateId>): StateId[] {
  return Array.from(states).sort()
}

export function simulateNFA(
  automaton: NondeterministicFiniteAutomaton,
  input: string | SymbolToken[],
): NondeterministicSimulationResult {
  const validation = validateNondeterministicFiniteAutomaton(automaton)
  const inputSymbols = toInputSymbols(input)

  if (!validation.isValid) {
    return {
      accepted: false,
      inputSymbols,
      startStates: [automaton.startState],
      finalStates: [automaton.startState],
      trace: [],
      errors: validation.errors,
    }
  }

  const epsilonTargetsByState = new Map<StateId, Set<StateId>>()
  const symbolTargetsByState = new Map<string, Set<StateId>>()

  for (const transition of automaton.transitions) {
    if (isEpsilonSymbol(transition.symbol)) {
      const currentTargets =
        epsilonTargetsByState.get(transition.from) ?? new Set<StateId>()
      transition.to.forEach((state) => currentTargets.add(state))
      epsilonTargetsByState.set(transition.from, currentTargets)
      continue
    }

    const key = `${transition.from}|${transition.symbol}`
    const currentTargets = symbolTargetsByState.get(key) ?? new Set<StateId>()
    transition.to.forEach((state) => currentTargets.add(state))
    symbolTargetsByState.set(key, currentTargets)
  }

  let currentStates = epsilonClosure([automaton.startState], epsilonTargetsByState)
  const startStates = sortStates(currentStates)
  const trace: NondeterministicSimulationResult['trace'] = []
  const errors: string[] = []

  inputSymbols.forEach((symbol, index) => {
    if (!automaton.alphabet.includes(symbol)) {
      errors.push(`Input symbol "${symbol}" is not in alphabet.`)
      return
    }

    const fromStates = sortStates(currentStates)
    const movedStates = new Set<StateId>()
    for (const state of currentStates) {
      const key = `${state}|${symbol}`
      const targets = symbolTargetsByState.get(key)
      if (!targets) {
        continue
      }
      targets.forEach((target) => movedStates.add(target))
    }

    currentStates = epsilonClosure(movedStates, epsilonTargetsByState)
    trace.push({
      index,
      symbol,
      fromStates,
      toStates: sortStates(currentStates),
    })
  })

  const finalStates = sortStates(currentStates)
  if (errors.length > 0) {
    return {
      accepted: false,
      inputSymbols,
      startStates,
      finalStates,
      trace,
      errors,
    }
  }

  return {
    accepted: finalStates.some((state) => automaton.acceptStates.includes(state)),
    inputSymbols,
    startStates,
    finalStates,
    trace,
    errors: [],
  }
}
