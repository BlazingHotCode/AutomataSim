import type {
  QueueAutomaton,
  QueueSimulationResult,
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

export function simulateQueueAutomaton(
  automaton: QueueAutomaton,
  input: string | SymbolToken[],
): QueueSimulationResult {
  const inputSymbols = toInputSymbols(input)
  const queue: SymbolToken[] = [automaton.queueStartSymbol]
  const trace: QueueSimulationResult['trace'] = []
  const errors: string[] = []
  let currentState = automaton.startState
  let inputIndex = 0
  let stepIndex = 0
  let guard = 0

  function selectTransition(symbol: SymbolToken | null) {
    const front = queue.length > 0 ? queue[0] : 'eps'
    const candidates = automaton.transitions.filter((candidate) => {
      if (candidate.from !== currentState) return false
      const matchesInput =
        symbol !== null &&
        (candidate.inputSymbol === symbol || isEpsilonSymbol(candidate.inputSymbol))
      const matchesEpsilonOnly =
        symbol === null && isEpsilonSymbol(candidate.inputSymbol)
      const matchesDequeue =
        candidate.dequeueSymbol === front ||
        isEpsilonSymbol(candidate.dequeueSymbol)
      return (matchesInput || matchesEpsilonOnly) && matchesDequeue
    })
    if (candidates.length === 0) return null
    candidates.sort((a, b) => {
      const scoreA =
        (symbol !== null && a.inputSymbol === symbol ? 2 : 0) +
        (!isEpsilonSymbol(a.dequeueSymbol) ? 1 : 0)
      const scoreB =
        (symbol !== null && b.inputSymbol === symbol ? 2 : 0) +
        (!isEpsilonSymbol(b.dequeueSymbol) ? 1 : 0)
      return scoreB - scoreA
    })
    return candidates[0]
  }

  while (inputIndex < inputSymbols.length && guard < 2000) {
    guard += 1
    const symbol = inputSymbols[inputIndex]
    const front = queue.length > 0 ? queue[0] : 'eps'
    const transition = selectTransition(symbol)

    if (!transition) {
      errors.push(
        `No transition defined for state "${currentState}" with input "${symbol}" and queue front "${front}".`,
      )
      break
    }

    const queueBefore = [...queue]
    if (!isEpsilonSymbol(transition.dequeueSymbol)) {
      queue.shift()
    }
    if (!isEpsilonSymbol(transition.enqueueSymbol)) {
      queue.push(transition.enqueueSymbol)
    }

    trace.push({
      index: stepIndex,
      inputSymbol: transition.inputSymbol,
      fromState: currentState,
      toState: transition.to,
      dequeueSymbol: transition.dequeueSymbol,
      enqueueSymbol: transition.enqueueSymbol,
      queueBefore,
      queueAfter: [...queue],
    })

    currentState = transition.to
    if (!isEpsilonSymbol(transition.inputSymbol)) {
      inputIndex += 1
    }
    stepIndex += 1
  }

  while (guard < 2000) {
    const transition = selectTransition(null)
    if (!transition) break
    guard += 1
    const queueBefore = [...queue]
    if (!isEpsilonSymbol(transition.dequeueSymbol)) {
      queue.shift()
    }
    if (!isEpsilonSymbol(transition.enqueueSymbol)) {
      queue.push(transition.enqueueSymbol)
    }
    trace.push({
      index: stepIndex,
      inputSymbol: transition.inputSymbol,
      fromState: currentState,
      toState: transition.to,
      dequeueSymbol: transition.dequeueSymbol,
      enqueueSymbol: transition.enqueueSymbol,
      queueBefore,
      queueAfter: [...queue],
    })
    currentState = transition.to
    stepIndex += 1
  }

  if (guard >= 2000) {
    errors.push('Queue automaton execution stopped due to step limit.')
  }
  if (inputIndex < inputSymbols.length && errors.length === 0) {
    errors.push('Queue automaton halted before consuming all input.')
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
