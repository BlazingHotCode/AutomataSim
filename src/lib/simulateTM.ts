import type {
  SymbolToken,
  TuringMachine,
  TuringSimulationResult,
} from '../types/automaton'

function toInputSymbols(input: string | SymbolToken[]): SymbolToken[] {
  if (Array.isArray(input)) return input
  const trimmed = input.trim()
  if (!trimmed) return []
  if (trimmed.includes(' ')) {
    return trimmed.split(/\s+/).filter((value) => value.length > 0)
  }
  return trimmed.split('')
}

export function simulateTuringMachine(
  machine: TuringMachine,
  input: string | SymbolToken[],
  stepLimit = 500,
): TuringSimulationResult {
  const inputSymbols = toInputSymbols(input)
  const tape = [...(inputSymbols.length > 0 ? inputSymbols : [machine.blankSymbol])]
  const trace: TuringSimulationResult['trace'] = []
  const errors: string[] = []
  let currentState = machine.startState
  let head = 0
  let steps = 0
  let haltedReason: TuringSimulationResult['haltedReason'] = 'reject'

  while (steps < stepLimit) {
    if (machine.acceptStates.includes(currentState)) {
      haltedReason = 'accept'
      break
    }

    if (head < 0) {
      tape.unshift(machine.blankSymbol)
      head = 0
    }
    if (head >= tape.length) {
      tape.push(machine.blankSymbol)
    }

    const readSymbol = tape[head]
    const transition = machine.transitions.find(
      (candidate) =>
        candidate.from === currentState && candidate.readSymbol === readSymbol,
    )

    if (!transition) {
      haltedReason = 'reject'
      break
    }

    const tapeBefore = [...tape]
    const headBefore = head
    tape[head] = transition.writeSymbol
    if (transition.move === 'L') head -= 1
    if (transition.move === 'R') head += 1
    const headAfter = head
    const toState = transition.to

    trace.push({
      index: steps,
      fromState: currentState,
      toState,
      readSymbol,
      writeSymbol: transition.writeSymbol,
      move: transition.move,
      headBefore,
      headAfter,
      tapeBefore,
      tapeAfter: [...tape],
    })

    currentState = toState
    steps += 1
  }

  if (steps >= stepLimit && !machine.acceptStates.includes(currentState)) {
    haltedReason = 'step_limit'
    errors.push(`Turing machine stopped after ${stepLimit} steps.`)
  }

  return {
    accepted: haltedReason === 'accept' && errors.length === 0,
    inputSymbols,
    startState: machine.startState,
    finalState: currentState,
    trace,
    haltedReason,
    errors,
  }
}
