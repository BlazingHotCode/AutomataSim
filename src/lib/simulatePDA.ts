import type {
  PushdownAutomaton,
  PushdownSimulationResult,
  SymbolToken,
} from '../types/automaton'

const EPSILON_SYMBOLS = new Set(['ε', 'epsilon', 'eps', 'e'])

function isEpsilonSymbol(symbol: string): boolean {
  return EPSILON_SYMBOLS.has(symbol)
}

function toInputSymbols(input: string | SymbolToken[]): SymbolToken[] {
  if (Array.isArray(input)) return input
  const trimmed = input.trim()
  if (!trimmed) return []
  if (trimmed.includes(' ')) {
    return trimmed.split(/\s+/).filter((value) => value.length > 0)
  }
  return trimmed.split('')
}

export function simulatePDA(
  automaton: PushdownAutomaton,
  input: string | SymbolToken[],
): PushdownSimulationResult {
  const inputSymbols = toInputSymbols(input)
  const trace: PushdownSimulationResult['trace'] = []
  const errors: string[] = []
  let currentState = automaton.startState
  const stack: SymbolToken[] = [automaton.stackStartSymbol]
  let index = 0
  let stepIndex = 0
  let maxGuard = 0

  function selectTransition(symbol: SymbolToken | null) {
    const top = stack.length > 0 ? stack[stack.length - 1] : 'eps'
    const candidates = automaton.transitions.filter((candidate) => {
      if (candidate.from !== currentState) return false
      const matchesInput =
        symbol !== null &&
        (candidate.inputSymbol === symbol || isEpsilonSymbol(candidate.inputSymbol))
      const matchesEpsilonOnly =
        symbol === null && isEpsilonSymbol(candidate.inputSymbol)
      const matchesPop =
        candidate.popSymbol === top || isEpsilonSymbol(candidate.popSymbol)
      return (matchesInput || matchesEpsilonOnly) && matchesPop
    })
    if (candidates.length === 0) return null
    candidates.sort((a, b) => {
      const scoreA =
        (symbol !== null && a.inputSymbol === symbol ? 2 : 0) +
        (!isEpsilonSymbol(a.popSymbol) ? 1 : 0)
      const scoreB =
        (symbol !== null && b.inputSymbol === symbol ? 2 : 0) +
        (!isEpsilonSymbol(b.popSymbol) ? 1 : 0)
      return scoreB - scoreA
    })
    return candidates[0]
  }

  while (index < inputSymbols.length && maxGuard < 2000) {
    maxGuard += 1
    const symbol = inputSymbols[index]
    const transition = selectTransition(symbol)

    if (!transition) {
      errors.push(
        `No transition defined for state "${currentState}" with input "${symbol}" and stack top "${top}".`,
      )
      break
    }

    const stackBefore = [...stack]
    if (!isEpsilonSymbol(transition.popSymbol)) {
      stack.pop()
    }
    for (let pushIndex = transition.pushSymbols.length - 1; pushIndex >= 0; pushIndex -= 1) {
      stack.push(transition.pushSymbols[pushIndex])
    }

    trace.push({
      index: stepIndex,
      inputSymbol: transition.inputSymbol,
      fromState: currentState,
      toState: transition.to,
      popSymbol: transition.popSymbol,
      pushSymbols: transition.pushSymbols,
      stackBefore,
      stackAfter: [...stack],
    })

    currentState = transition.to
    if (!isEpsilonSymbol(transition.inputSymbol)) {
      index += 1
    }
    stepIndex += 1
  }

  while (maxGuard < 2000) {
    const transition = selectTransition(null)
    if (!transition) break
    maxGuard += 1

    const stackBefore = [...stack]
    if (!isEpsilonSymbol(transition.popSymbol)) {
      stack.pop()
    }
    for (let pushIndex = transition.pushSymbols.length - 1; pushIndex >= 0; pushIndex -= 1) {
      stack.push(transition.pushSymbols[pushIndex])
    }
    trace.push({
      index: stepIndex,
      inputSymbol: transition.inputSymbol,
      fromState: currentState,
      toState: transition.to,
      popSymbol: transition.popSymbol,
      pushSymbols: transition.pushSymbols,
      stackBefore,
      stackAfter: [...stack],
    })
    currentState = transition.to
    stepIndex += 1
  }

  if (maxGuard >= 2000) {
    errors.push('PDA execution stopped due to step limit.')
  }

  if (index < inputSymbols.length && errors.length === 0) {
    errors.push('PDA halted before consuming all input.')
  }

  return {
    accepted:
      errors.length === 0 && automaton.acceptStates.includes(currentState),
    inputSymbols,
    startState: automaton.startState,
    finalState: currentState,
    trace,
    errors,
  }
}
