import type {
  DeterministicFiniteAutomaton,
  NondeterministicFiniteAutomaton,
  ValidationResult,
} from '../types/automaton'

const EPSILON_SYMBOLS = new Set(['ε', 'epsilon', 'eps', 'e'])

function isEpsilonSymbol(symbol: string): boolean {
  return EPSILON_SYMBOLS.has(symbol)
}

export function validateDeterministicFiniteAutomaton(
  automaton: DeterministicFiniteAutomaton,
): ValidationResult {
  const errors: string[] = []
  const stateSet = new Set(automaton.states)
  const alphabetSet = new Set(automaton.alphabet)

  if (automaton.states.length === 0) {
    errors.push('Automaton must contain at least one state.')
  }
  if (automaton.alphabet.length === 0) {
    errors.push('Alphabet must contain at least one symbol.')
  }

  if (stateSet.size !== automaton.states.length) {
    errors.push('State names must be unique.')
  }
  if (alphabetSet.size !== automaton.alphabet.length) {
    errors.push('Alphabet symbols must be unique.')
  }

  if (!stateSet.has(automaton.startState)) {
    errors.push(`Start state "${automaton.startState}" is not in states.`)
  }

  for (const acceptState of automaton.acceptStates) {
    if (!stateSet.has(acceptState)) {
      errors.push(`Accept state "${acceptState}" is not in states.`)
    }
  }

  const transitionKeys = new Set<string>()
  for (const transition of automaton.transitions) {
    if (!stateSet.has(transition.from)) {
      errors.push(`Transition source "${transition.from}" is not in states.`)
    }
    if (!stateSet.has(transition.to)) {
      errors.push(`Transition target "${transition.to}" is not in states.`)
    }
    if (!alphabetSet.has(transition.symbol)) {
      errors.push(
        `Transition symbol "${transition.symbol}" is not in alphabet.`,
      )
    }

    const key = `${transition.from}|${transition.symbol}`
    if (transitionKeys.has(key)) {
      errors.push(
        `Duplicate transition for state "${transition.from}" and symbol "${transition.symbol}".`,
      )
    }
    transitionKeys.add(key)
  }

  for (const state of automaton.states) {
    for (const symbol of automaton.alphabet) {
      const key = `${state}|${symbol}`
      if (!transitionKeys.has(key)) {
        errors.push(
          `Missing transition for state "${state}" and symbol "${symbol}".`,
        )
      }
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
  }
}

export function validateNondeterministicFiniteAutomaton(
  automaton: NondeterministicFiniteAutomaton,
): ValidationResult {
  const errors: string[] = []
  const stateSet = new Set(automaton.states)
  const alphabetSet = new Set(automaton.alphabet)

  if (automaton.states.length === 0) {
    errors.push('Automaton must contain at least one state.')
  }
  if (automaton.alphabet.length === 0) {
    errors.push('Alphabet must contain at least one symbol.')
  }

  if (stateSet.size !== automaton.states.length) {
    errors.push('State names must be unique.')
  }
  if (alphabetSet.size !== automaton.alphabet.length) {
    errors.push('Alphabet symbols must be unique.')
  }

  if (!stateSet.has(automaton.startState)) {
    errors.push(`Start state "${automaton.startState}" is not in states.`)
  }

  for (const acceptState of automaton.acceptStates) {
    if (!stateSet.has(acceptState)) {
      errors.push(`Accept state "${acceptState}" is not in states.`)
    }
  }

  const transitionKeys = new Set<string>()
  for (const transition of automaton.transitions) {
    if (!stateSet.has(transition.from)) {
      errors.push(`Transition source "${transition.from}" is not in states.`)
    }

    if (!alphabetSet.has(transition.symbol) && !isEpsilonSymbol(transition.symbol)) {
      errors.push(
        `Transition symbol "${transition.symbol}" is not in alphabet or epsilon.`,
      )
    }

    if (transition.to.length === 0) {
      errors.push(
        `Transition target list for "${transition.from},${transition.symbol}" must not be empty.`,
      )
    }

    for (const target of transition.to) {
      if (!stateSet.has(target)) {
        errors.push(`Transition target "${target}" is not in states.`)
      }
      const key = `${transition.from}|${transition.symbol}|${target}`
      if (transitionKeys.has(key)) {
        errors.push(
          `Duplicate transition for state "${transition.from}", symbol "${transition.symbol}", and target "${target}".`,
        )
      }
      transitionKeys.add(key)
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
  }
}
