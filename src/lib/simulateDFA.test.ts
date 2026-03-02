import { describe, expect, it } from 'vitest'
import { simulateDFA } from './simulateDFA'
import type { DeterministicFiniteAutomaton } from '../types/automaton'

const baseAutomaton: DeterministicFiniteAutomaton = {
  states: ['q0', 'q1'],
  alphabet: ['0', '1'],
  startState: 'q0',
  acceptStates: ['q1'],
  transitions: [
    { from: 'q0', symbol: '0', to: 'q0' },
    { from: 'q0', symbol: '1', to: 'q1' },
    { from: 'q1', symbol: '0', to: 'q0' },
    { from: 'q1', symbol: '1', to: 'q1' },
  ],
}

describe('simulateDFA', () => {
  it('accepts valid strings that end in an accept state', () => {
    const result = simulateDFA(baseAutomaton, '101')

    expect(result.errors).toEqual([])
    expect(result.accepted).toBe(true)
    expect(result.finalState).toBe('q1')
    expect(result.trace).toHaveLength(3)
  })

  it('rejects valid strings that end in a non-accept state', () => {
    const result = simulateDFA(baseAutomaton, '10')

    expect(result.errors).toEqual([])
    expect(result.accepted).toBe(false)
    expect(result.finalState).toBe('q0')
    expect(result.trace).toHaveLength(2)
  })

  it('returns a clear error when transitions are missing', () => {
    const invalidAutomaton: DeterministicFiniteAutomaton = {
      ...baseAutomaton,
      transitions: baseAutomaton.transitions.filter(
        (transition) =>
          !(transition.from === 'q1' && transition.symbol === '0'),
      ),
    }

    const result = simulateDFA(invalidAutomaton, '10')

    expect(result.accepted).toBe(false)
    expect(result.errors).toContain(
      'Missing transition for state "q1" and symbol "0".',
    )
  })
})
