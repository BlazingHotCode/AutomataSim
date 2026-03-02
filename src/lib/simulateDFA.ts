import type {
  DeterministicFiniteAutomaton,
  DeterministicSimulationResult,
  SymbolToken,
} from '../types/automaton'
import { validateDeterministicFiniteAutomaton } from './validateAutomaton'

function toInputSymbols(input: string | SymbolToken[]): SymbolToken[] {
  if (Array.isArray(input)) {
    return input
  }

  const trimmed = input.trim()
  if (trimmed.length === 0) {
    return []
  }

  // If spaces exist, treat each whitespace-delimited token as one symbol.
  if (trimmed.includes(' ')) {
    return trimmed.split(/\s+/).filter((symbol) => symbol.length > 0)
  }

  // Default to per-character symbols (for alphabets like 0/1/a/b).
  return trimmed.split('')
}

export function simulateDFA(
  automaton: DeterministicFiniteAutomaton,
  input: string | SymbolToken[],
): DeterministicSimulationResult {
  const validation = validateDeterministicFiniteAutomaton(automaton)
  const inputSymbols = toInputSymbols(input)

  if (!validation.isValid) {
    return {
      accepted: false,
      inputSymbols,
      startState: automaton.startState,
      finalState: automaton.startState,
      trace: [],
      errors: validation.errors,
    }
  }

  const transitionMap = new Map<string, string>()
  for (const transition of automaton.transitions) {
    transitionMap.set(`${transition.from}|${transition.symbol}`, transition.to)
  }

  let currentState = automaton.startState
  const trace: DeterministicSimulationResult['trace'] = []
  const errors: string[] = []

  inputSymbols.forEach((symbol, index) => {
    if (!automaton.alphabet.includes(symbol)) {
      errors.push(`Input symbol "${symbol}" is not in alphabet.`)
      return
    }

    const transitionKey = `${currentState}|${symbol}`
    const nextState = transitionMap.get(transitionKey)
    if (!nextState) {
      errors.push(
        `No transition defined for state "${currentState}" and symbol "${symbol}".`,
      )
      return
    }

    trace.push({
      index,
      symbol,
      fromState: currentState,
      toState: nextState,
    })
    currentState = nextState
  })

  if (errors.length > 0) {
    return {
      accepted: false,
      inputSymbols,
      startState: automaton.startState,
      finalState: currentState,
      trace,
      errors,
    }
  }

  return {
    accepted: automaton.acceptStates.includes(currentState),
    inputSymbols,
    startState: automaton.startState,
    finalState: currentState,
    trace,
    errors: [],
  }
}
