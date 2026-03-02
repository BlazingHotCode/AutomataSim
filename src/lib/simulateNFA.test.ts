import { describe, expect, it } from 'vitest'
import { simulateNFA } from './simulateNFA'
import type { NondeterministicFiniteAutomaton } from '../types/automaton'

const nfaWithEpsilon: NondeterministicFiniteAutomaton = {
  states: ['q0', 'q1', 'q2'],
  alphabet: ['0', '1'],
  startState: 'q0',
  acceptStates: ['q2'],
  transitions: [
    { from: 'q0', symbol: 'eps', to: ['q1'] },
    { from: 'q1', symbol: '1', to: ['q1'] },
    { from: 'q1', symbol: '0', to: ['q2'] },
    { from: 'q2', symbol: '0', to: ['q2'] },
    { from: 'q2', symbol: '1', to: ['q2'] },
  ],
}

describe('simulateNFA', () => {
  it('uses epsilon-closure before reading input', () => {
    const result = simulateNFA(nfaWithEpsilon, '0')

    expect(result.errors).toEqual([])
    expect(result.startStates).toEqual(['q0', 'q1'])
    expect(result.finalStates).toEqual(['q2'])
    expect(result.accepted).toBe(true)
    expect(result.trace).toHaveLength(1)
    expect(result.trace[0]).toEqual({
      index: 0,
      symbol: '0',
      fromStates: ['q0', 'q1'],
      toStates: ['q2'],
    })
  })

  it('rejects when no active state reaches an accept state', () => {
    const result = simulateNFA(nfaWithEpsilon, '1')

    expect(result.errors).toEqual([])
    expect(result.accepted).toBe(false)
    expect(result.finalStates).toEqual(['q1'])
  })

  it('returns a clear error for input symbols outside the alphabet', () => {
    const result = simulateNFA(nfaWithEpsilon, '2')

    expect(result.accepted).toBe(false)
    expect(result.errors).toContain('Input symbol "2" is not in alphabet.')
  })
})
