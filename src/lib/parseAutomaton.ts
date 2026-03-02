import type {
  DeterministicFiniteAutomaton,
  DeterministicTransition,
  NondeterministicFiniteAutomaton,
  NondeterministicTransition,
  ParseResult,
  PushdownAutomaton,
  PushdownTransition,
  QueueAutomaton,
  QueueTransition,
  TuringHeadMove,
  TuringMachine,
  TuringTransition,
} from '../types/automaton'

const EPSILON_SYMBOLS = new Set(['ε', 'epsilon', 'eps', 'e'])

function isEpsilonSymbol(symbol: string): boolean {
  return EPSILON_SYMBOLS.has(symbol)
}

function parseCsv(value: string): string[] {
  return value
    .split(',')
    .map((token) => token.trim())
    .filter((token) => token.length > 0)
}

function parsePipeSeparated(value: string): string[] {
  return value
    .split('|')
    .map((token) => token.trim())
    .filter((token) => token.length > 0)
}

interface ParsedBaseSections {
  states: string[]
  alphabet: string[]
  startState: string
  acceptStates: string[]
  transitionLines: string[]
  stateSet: Set<string>
  alphabetSet: Set<string>
}

function parseBaseSections(text: string): {
  value: ParsedBaseSections | null
  errors: string[]
} {
  const errors: string[] = []
  const normalizedLines = text
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line.length > 0 && !line.startsWith('#'))

  const statesLine = normalizedLines.find((line) => line.startsWith('states:'))
  const alphabetLine = normalizedLines.find((line) =>
    line.startsWith('alphabet:'),
  )
  const startLine = normalizedLines.find((line) => line.startsWith('start:'))
  const acceptLine = normalizedLines.find((line) => line.startsWith('accept:'))
  const transitionsIndex = normalizedLines.findIndex(
    (line) => line === 'transitions:',
  )

  if (!statesLine) errors.push('Missing "states:" line.')
  if (!alphabetLine) errors.push('Missing "alphabet:" line.')
  if (!startLine) errors.push('Missing "start:" line.')
  if (!acceptLine) errors.push('Missing "accept:" line.')
  if (transitionsIndex < 0) errors.push('Missing "transitions:" section.')

  if (errors.length > 0) {
    return { value: null, errors }
  }

  const states = parseCsv(statesLine!.slice('states:'.length))
  const alphabet = parseCsv(alphabetLine!.slice('alphabet:'.length))
  const startState = startLine!.slice('start:'.length).trim()
  const acceptStates = parseCsv(acceptLine!.slice('accept:'.length))

  if (states.length === 0) errors.push('States list must not be empty.')
  if (alphabet.length === 0) errors.push('Alphabet list must not be empty.')
  if (!startState) errors.push('Start state must not be empty.')
  if (acceptStates.length === 0) {
    errors.push('Accept states list must not be empty.')
  }

  const stateSet = new Set(states)
  const alphabetSet = new Set(alphabet)
  if (stateSet.size !== states.length)
    errors.push('State names must be unique.')
  if (alphabetSet.size !== alphabet.length) {
    errors.push('Alphabet symbols must be unique.')
  }

  if (!stateSet.has(startState)) {
    errors.push(`Start state "${startState}" is not in states.`)
  }
  for (const acceptState of acceptStates) {
    if (!stateSet.has(acceptState)) {
      errors.push(`Accept state "${acceptState}" is not in states.`)
    }
  }

  const transitionLines = normalizedLines.slice(transitionsIndex + 1)
  if (transitionLines.length === 0) {
    errors.push('At least one transition is required.')
  }

  if (errors.length > 0) {
    return { value: null, errors }
  }

  return {
    value: {
      states,
      alphabet,
      startState,
      acceptStates,
      transitionLines,
      stateSet,
      alphabetSet,
    },
    errors: [],
  }
}

export function parseDeterministicFiniteAutomaton(
  text: string,
): ParseResult<DeterministicFiniteAutomaton> {
  const base = parseBaseSections(text)
  if (!base.value) {
    return { value: null, errors: base.errors }
  }

  const errors: string[] = []
  const transitions: DeterministicTransition[] = []
  const transitionKeys = new Set<string>()

  for (const line of base.value.transitionLines) {
    const match = line.match(/^([^,]+),([^-\s]+)\s*->\s*(.+)$/)
    if (!match) {
      errors.push(`Invalid transition format: "${line}".`)
      continue
    }

    const from = match[1].trim()
    const symbol = match[2].trim()
    const to = match[3].trim()

    if (!base.value.stateSet.has(from)) {
      errors.push(`Transition source "${from}" is not in states.`)
    }
    if (!base.value.stateSet.has(to)) {
      errors.push(`Transition target "${to}" is not in states.`)
    }
    if (!base.value.alphabetSet.has(symbol)) {
      errors.push(`Transition symbol "${symbol}" is not in alphabet.`)
    }

    const key = `${from}|${symbol}`
    if (transitionKeys.has(key)) {
      errors.push(
        `Duplicate transition for state "${from}" and symbol "${symbol}".`,
      )
    }
    transitionKeys.add(key)
    transitions.push({ from, symbol, to })
  }

  if (errors.length > 0) {
    return { value: null, errors }
  }

  return {
    value: {
      states: base.value.states,
      alphabet: base.value.alphabet,
      startState: base.value.startState,
      acceptStates: base.value.acceptStates,
      transitions,
    },
    errors: [],
  }
}

export function parseNondeterministicFiniteAutomaton(
  text: string,
): ParseResult<NondeterministicFiniteAutomaton> {
  const base = parseBaseSections(text)
  const baseValue = base.value
  if (!baseValue) {
    return { value: null, errors: base.errors }
  }

  const errors: string[] = []
  const transitions: NondeterministicTransition[] = []
  const transitionKeys = new Set<string>()

  for (const line of baseValue.transitionLines) {
    const match = line.match(/^([^,]+),([^-\s]+)\s*->\s*(.+)$/)
    if (!match) {
      errors.push(`Invalid transition format: "${line}".`)
      continue
    }

    const from = match[1].trim()
    const symbol = match[2].trim()
    const targetList = match[3].trim()
    const to = targetList
      .split('|')
      .map((token) => token.trim())
      .filter((token) => token.length > 0)

    if (!baseValue.stateSet.has(from)) {
      errors.push(`Transition source "${from}" is not in states.`)
    }
    if (!baseValue.alphabetSet.has(symbol) && !isEpsilonSymbol(symbol)) {
      errors.push(
        `Transition symbol "${symbol}" is not in alphabet or epsilon.`,
      )
    }
    if (to.length === 0) {
      errors.push(`Transition target list must not be empty for "${line}".`)
    }

    to.forEach((target) => {
      if (!baseValue.stateSet.has(target)) {
        errors.push(`Transition target "${target}" is not in states.`)
      }
      const key = `${from}|${symbol}|${target}`
      if (transitionKeys.has(key)) {
        errors.push(
          `Duplicate transition for state "${from}", symbol "${symbol}", and target "${target}".`,
        )
      }
      transitionKeys.add(key)
    })

    transitions.push({ from, symbol, to })
  }

  if (errors.length > 0) {
    return { value: null, errors }
  }

  return {
    value: {
      states: baseValue.states,
      alphabet: baseValue.alphabet,
      startState: baseValue.startState,
      acceptStates: baseValue.acceptStates,
      transitions,
    },
    errors: [],
  }
}

export function parsePushdownAutomaton(
  text: string,
): ParseResult<PushdownAutomaton> {
  const errors: string[] = []
  const normalizedLines = text
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line.length > 0 && !line.startsWith('#'))

  const statesLine = normalizedLines.find((line) => line.startsWith('states:'))
  const alphabetLine = normalizedLines.find((line) =>
    line.startsWith('alphabet:'),
  )
  const stackAlphabetLine = normalizedLines.find((line) =>
    line.startsWith('stackAlphabet:'),
  )
  const stackStartLine = normalizedLines.find((line) =>
    line.startsWith('stackStart:'),
  )
  const startLine = normalizedLines.find((line) => line.startsWith('start:'))
  const acceptLine = normalizedLines.find((line) => line.startsWith('accept:'))
  const transitionsIndex = normalizedLines.findIndex(
    (line) => line === 'transitions:',
  )

  if (!statesLine) errors.push('Missing "states:" line.')
  if (!alphabetLine) errors.push('Missing "alphabet:" line.')
  if (!stackAlphabetLine) errors.push('Missing "stackAlphabet:" line.')
  if (!stackStartLine) errors.push('Missing "stackStart:" line.')
  if (!startLine) errors.push('Missing "start:" line.')
  if (!acceptLine) errors.push('Missing "accept:" line.')
  if (transitionsIndex < 0) errors.push('Missing "transitions:" section.')

  if (errors.length > 0) {
    return { value: null, errors }
  }

  const states = parseCsv(statesLine!.slice('states:'.length))
  const alphabet = parseCsv(alphabetLine!.slice('alphabet:'.length))
  const stackAlphabet = parseCsv(
    stackAlphabetLine!.slice('stackAlphabet:'.length),
  )
  const stackStartSymbol = stackStartLine!.slice('stackStart:'.length).trim()
  const startState = startLine!.slice('start:'.length).trim()
  const acceptStates = parseCsv(acceptLine!.slice('accept:'.length))

  if (states.length === 0) errors.push('States list must not be empty.')
  if (alphabet.length === 0) errors.push('Alphabet list must not be empty.')
  if (stackAlphabet.length === 0) {
    errors.push('Stack alphabet list must not be empty.')
  }
  if (!stackStartSymbol) errors.push('Stack start symbol must not be empty.')
  if (!startState) errors.push('Start state must not be empty.')
  if (acceptStates.length === 0) {
    errors.push('Accept states list must not be empty.')
  }

  const stateSet = new Set(states)
  const alphabetSet = new Set(alphabet)
  const stackAlphabetSet = new Set(stackAlphabet)

  if (stateSet.size !== states.length)
    errors.push('State names must be unique.')
  if (alphabetSet.size !== alphabet.length) {
    errors.push('Alphabet symbols must be unique.')
  }
  if (stackAlphabetSet.size !== stackAlphabet.length) {
    errors.push('Stack alphabet symbols must be unique.')
  }

  if (!stateSet.has(startState)) {
    errors.push(`Start state "${startState}" is not in states.`)
  }
  for (const acceptState of acceptStates) {
    if (!stateSet.has(acceptState)) {
      errors.push(`Accept state "${acceptState}" is not in states.`)
    }
  }
  if (!stackAlphabetSet.has(stackStartSymbol)) {
    errors.push(`Stack start symbol "${stackStartSymbol}" is not in stack alphabet.`)
  }

  const transitionLines = normalizedLines.slice(transitionsIndex + 1)
  if (transitionLines.length === 0) {
    errors.push('At least one transition is required.')
  }

  if (errors.length > 0) {
    return { value: null, errors }
  }

  const transitions: PushdownTransition[] = []
  const transitionKeys = new Set<string>()

  for (const line of transitionLines) {
    const match = line.match(/^([^,]+),([^,]+),([^-\s]+)\s*->\s*([^,]+),(.+)$/)
    if (!match) {
      errors.push(
        `Invalid transition format: "${line}". Expected: source,input,pop -> target,pushA|pushB`,
      )
      continue
    }

    const from = match[1].trim()
    const inputSymbol = match[2].trim()
    const popSymbol = match[3].trim()
    const to = match[4].trim()
    const pushRaw = match[5].trim()
    const pushParts = parsePipeSeparated(pushRaw)
    const pushSymbols =
      pushParts.length === 1 && isEpsilonSymbol(pushParts[0]) ? [] : pushParts

    if (!stateSet.has(from)) {
      errors.push(`Transition source "${from}" is not in states.`)
    }
    if (!stateSet.has(to)) {
      errors.push(`Transition target "${to}" is not in states.`)
    }
    if (!alphabetSet.has(inputSymbol) && !isEpsilonSymbol(inputSymbol)) {
      errors.push(
        `Transition input symbol "${inputSymbol}" is not in alphabet or epsilon.`,
      )
    }
    if (!stackAlphabetSet.has(popSymbol) && !isEpsilonSymbol(popSymbol)) {
      errors.push(
        `Transition pop symbol "${popSymbol}" is not in stack alphabet or epsilon.`,
      )
    }
    if (pushRaw.length === 0 || pushParts.length === 0) {
      errors.push(`Transition push action must not be empty for "${line}".`)
    }
    for (const symbol of pushSymbols) {
      if (!stackAlphabetSet.has(symbol)) {
        errors.push(
          `Transition push symbol "${symbol}" is not in stack alphabet.`,
        )
      }
    }

    const key = `${from}|${inputSymbol}|${popSymbol}|${to}|${pushSymbols.join('|')}`
    if (transitionKeys.has(key)) {
      errors.push(
        `Duplicate transition for "${from},${inputSymbol},${popSymbol} -> ${to},${pushSymbols.join('|') || 'eps'}".`,
      )
    }
    transitionKeys.add(key)
    transitions.push({ from, inputSymbol, popSymbol, to, pushSymbols })
  }

  if (errors.length > 0) {
    return { value: null, errors }
  }

  return {
    value: {
      states,
      alphabet,
      stackAlphabet,
      startState,
      acceptStates,
      stackStartSymbol,
      transitions,
    },
    errors: [],
  }
}

export function parseQueueAutomaton(text: string): ParseResult<QueueAutomaton> {
  const errors: string[] = []
  const normalizedLines = text
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line.length > 0 && !line.startsWith('#'))

  const statesLine = normalizedLines.find((line) => line.startsWith('states:'))
  const alphabetLine = normalizedLines.find((line) =>
    line.startsWith('alphabet:'),
  )
  const queueAlphabetLine = normalizedLines.find((line) =>
    line.startsWith('queueAlphabet:'),
  )
  const queueStartLine = normalizedLines.find((line) =>
    line.startsWith('queueStart:'),
  )
  const startLine = normalizedLines.find((line) => line.startsWith('start:'))
  const acceptLine = normalizedLines.find((line) => line.startsWith('accept:'))
  const transitionsIndex = normalizedLines.findIndex(
    (line) => line === 'transitions:',
  )

  if (!statesLine) errors.push('Missing "states:" line.')
  if (!alphabetLine) errors.push('Missing "alphabet:" line.')
  if (!queueAlphabetLine) errors.push('Missing "queueAlphabet:" line.')
  if (!queueStartLine) errors.push('Missing "queueStart:" line.')
  if (!startLine) errors.push('Missing "start:" line.')
  if (!acceptLine) errors.push('Missing "accept:" line.')
  if (transitionsIndex < 0) errors.push('Missing "transitions:" section.')
  if (errors.length > 0) return { value: null, errors }

  const states = parseCsv(statesLine!.slice('states:'.length))
  const alphabet = parseCsv(alphabetLine!.slice('alphabet:'.length))
  const queueAlphabet = parseCsv(queueAlphabetLine!.slice('queueAlphabet:'.length))
  const queueStartSymbol = queueStartLine!.slice('queueStart:'.length).trim()
  const startState = startLine!.slice('start:'.length).trim()
  const acceptStates = parseCsv(acceptLine!.slice('accept:'.length))

  const stateSet = new Set(states)
  const alphabetSet = new Set(alphabet)
  const queueAlphabetSet = new Set(queueAlphabet)
  if (!stateSet.has(startState)) errors.push(`Start state "${startState}" is not in states.`)
  if (!queueAlphabetSet.has(queueStartSymbol)) {
    errors.push(`Queue start symbol "${queueStartSymbol}" is not in queue alphabet.`)
  }
  for (const s of acceptStates) {
    if (!stateSet.has(s)) errors.push(`Accept state "${s}" is not in states.`)
  }

  const transitionLines = normalizedLines.slice(transitionsIndex + 1)
  const transitions: QueueTransition[] = []
  const transitionKeys = new Set<string>()
  for (const line of transitionLines) {
    const match = line.match(/^([^,]+),([^,]+),([^-\s]+)\s*->\s*([^,]+),(.+)$/)
    if (!match) {
      errors.push(
        `Invalid transition format: "${line}". Expected: source,input,dequeue -> target,enqueue`,
      )
      continue
    }
    const from = match[1].trim()
    const inputSymbol = match[2].trim()
    const dequeueSymbol = match[3].trim()
    const to = match[4].trim()
    const enqueueSymbol = match[5].trim()

    if (!stateSet.has(from)) errors.push(`Transition source "${from}" is not in states.`)
    if (!stateSet.has(to)) errors.push(`Transition target "${to}" is not in states.`)
    if (!alphabetSet.has(inputSymbol) && !isEpsilonSymbol(inputSymbol)) {
      errors.push(`Transition input symbol "${inputSymbol}" is not in alphabet or epsilon.`)
    }
    if (!queueAlphabetSet.has(dequeueSymbol) && !isEpsilonSymbol(dequeueSymbol)) {
      errors.push(`Transition dequeue symbol "${dequeueSymbol}" is not in queue alphabet or epsilon.`)
    }
    if (!queueAlphabetSet.has(enqueueSymbol) && !isEpsilonSymbol(enqueueSymbol)) {
      errors.push(`Transition enqueue symbol "${enqueueSymbol}" is not in queue alphabet or epsilon.`)
    }
    const key = `${from}|${inputSymbol}|${dequeueSymbol}|${to}|${enqueueSymbol}`
    if (transitionKeys.has(key)) {
      errors.push(`Duplicate transition "${line}".`)
    }
    transitionKeys.add(key)
    transitions.push({ from, inputSymbol, dequeueSymbol, to, enqueueSymbol })
  }

  if (errors.length > 0) return { value: null, errors }

  return {
    value: {
      states,
      alphabet,
      queueAlphabet,
      queueStartSymbol,
      startState,
      acceptStates,
      transitions,
    },
    errors: [],
  }
}

export function parseTuringMachine(text: string): ParseResult<TuringMachine> {
  const errors: string[] = []
  const normalizedLines = text
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line.length > 0 && !line.startsWith('#'))

  const statesLine = normalizedLines.find((line) => line.startsWith('states:'))
  const alphabetLine = normalizedLines.find((line) =>
    line.startsWith('alphabet:'),
  )
  const tapeAlphabetLine = normalizedLines.find((line) =>
    line.startsWith('tapeAlphabet:'),
  )
  const blankLine = normalizedLines.find((line) => line.startsWith('blank:'))
  const startLine = normalizedLines.find((line) => line.startsWith('start:'))
  const acceptLine = normalizedLines.find((line) => line.startsWith('accept:'))
  const transitionsIndex = normalizedLines.findIndex(
    (line) => line === 'transitions:',
  )

  if (!statesLine) errors.push('Missing "states:" line.')
  if (!alphabetLine) errors.push('Missing "alphabet:" line.')
  if (!tapeAlphabetLine) errors.push('Missing "tapeAlphabet:" line.')
  if (!blankLine) errors.push('Missing "blank:" line.')
  if (!startLine) errors.push('Missing "start:" line.')
  if (!acceptLine) errors.push('Missing "accept:" line.')
  if (transitionsIndex < 0) errors.push('Missing "transitions:" section.')
  if (errors.length > 0) return { value: null, errors }

  const states = parseCsv(statesLine!.slice('states:'.length))
  const alphabet = parseCsv(alphabetLine!.slice('alphabet:'.length))
  const tapeAlphabet = parseCsv(tapeAlphabetLine!.slice('tapeAlphabet:'.length))
  const blankSymbol = blankLine!.slice('blank:'.length).trim()
  const startState = startLine!.slice('start:'.length).trim()
  const acceptStates = parseCsv(acceptLine!.slice('accept:'.length))

  const stateSet = new Set(states)
  const tapeAlphabetSet = new Set(tapeAlphabet)
  if (!stateSet.has(startState)) errors.push(`Start state "${startState}" is not in states.`)
  for (const s of acceptStates) {
    if (!stateSet.has(s)) errors.push(`Accept state "${s}" is not in states.`)
  }
  if (!tapeAlphabetSet.has(blankSymbol)) {
    errors.push(`Blank symbol "${blankSymbol}" is not in tape alphabet.`)
  }
  for (const symbol of alphabet) {
    if (!tapeAlphabetSet.has(symbol)) {
      errors.push(`Input alphabet symbol "${symbol}" is not in tape alphabet.`)
    }
  }

  const transitions: TuringTransition[] = []
  const transitionLines = normalizedLines.slice(transitionsIndex + 1)
  const keys = new Set<string>()
  for (const line of transitionLines) {
    const match = line.match(/^([^,]+),([^-\s]+)\s*->\s*([^,]+),([^,]+),([^,\s]+)$/)
    if (!match) {
      errors.push(
        `Invalid transition format: "${line}". Expected: source,read -> target,write,Move`,
      )
      continue
    }
    const from = match[1].trim()
    const readSymbol = match[2].trim()
    const to = match[3].trim()
    const writeSymbol = match[4].trim()
    const move = match[5].trim() as TuringHeadMove

    if (!stateSet.has(from)) errors.push(`Transition source "${from}" is not in states.`)
    if (!stateSet.has(to)) errors.push(`Transition target "${to}" is not in states.`)
    if (!tapeAlphabetSet.has(readSymbol)) errors.push(`Read symbol "${readSymbol}" is not in tape alphabet.`)
    if (!tapeAlphabetSet.has(writeSymbol)) errors.push(`Write symbol "${writeSymbol}" is not in tape alphabet.`)
    if (!['L', 'R', 'S'].includes(move)) errors.push(`Move "${move}" must be L, R, or S.`)
    const key = `${from}|${readSymbol}`
    if (keys.has(key)) errors.push(`Duplicate transition for state "${from}" and symbol "${readSymbol}".`)
    keys.add(key)
    transitions.push({ from, readSymbol, to, writeSymbol, move })
  }

  if (errors.length > 0) return { value: null, errors }

  return {
    value: {
      states,
      alphabet,
      tapeAlphabet,
      blankSymbol,
      startState,
      acceptStates,
      transitions,
    },
    errors: [],
  }
}
