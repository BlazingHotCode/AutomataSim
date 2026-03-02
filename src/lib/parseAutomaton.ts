import type {
  DeterministicFiniteAutomaton,
  DeterministicTransition,
  NondeterministicFiniteAutomaton,
  NondeterministicTransition,
  ParseResult,
  PushdownAutomaton,
  PushdownTransition,
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
