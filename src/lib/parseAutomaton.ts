import type {
  DeterministicFiniteAutomaton,
  DeterministicTransition,
  ParseResult,
} from '../types/automaton'

function parseCsv(value: string): string[] {
  return value
    .split(',')
    .map((token) => token.trim())
    .filter((token) => token.length > 0)
}

export function parseDeterministicFiniteAutomaton(
  text: string,
): ParseResult<DeterministicFiniteAutomaton> {
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
  const transitions: DeterministicTransition[] = []
  const transitionKeys = new Set<string>()

  if (transitionLines.length === 0) {
    errors.push('At least one transition is required.')
  }

  for (const line of transitionLines) {
    const match = line.match(/^([^,]+),([^-\s]+)\s*->\s*(.+)$/)
    if (!match) {
      errors.push(`Invalid transition format: "${line}".`)
      continue
    }

    const from = match[1].trim()
    const symbol = match[2].trim()
    const to = match[3].trim()

    if (!stateSet.has(from)) {
      errors.push(`Transition source "${from}" is not in states.`)
    }
    if (!stateSet.has(to)) {
      errors.push(`Transition target "${to}" is not in states.`)
    }
    if (!alphabetSet.has(symbol)) {
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
      states,
      alphabet,
      startState,
      acceptStates,
      transitions,
    },
    errors: [],
  }
}
