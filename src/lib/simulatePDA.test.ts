import { describe, expect, it } from 'vitest'
import type { PushdownAutomaton } from '../types/automaton'
import { simulatePDA } from './simulatePDA'

const pda: PushdownAutomaton = {
  states: ['q0', 'q1'],
  alphabet: ['a', 'b'],
  stackAlphabet: ['Z', 'A'],
  startState: 'q0',
  acceptStates: ['q1'],
  stackStartSymbol: 'Z',
  transitions: [
    { from: 'q0', inputSymbol: 'a', popSymbol: 'Z', to: 'q0', pushSymbols: ['A', 'Z'] },
    { from: 'q0', inputSymbol: 'a', popSymbol: 'A', to: 'q0', pushSymbols: ['A', 'A'] },
    { from: 'q0', inputSymbol: 'b', popSymbol: 'A', to: 'q0', pushSymbols: [] },
    { from: 'q0', inputSymbol: 'e', popSymbol: 'Z', to: 'q1', pushSymbols: ['Z'] },
  ],
}

describe('simulatePDA', () => {
  it('accepts balanced a^n b^n shape', () => {
    const result = simulatePDA(pda, 'aabb')
    expect(result.errors).toEqual([])
    expect(result.accepted).toBe(true)
    expect(result.finalState).toBe('q1')
  })

  it('rejects unbalanced input', () => {
    const result = simulatePDA(pda, 'aaab')
    expect(result.accepted).toBe(false)
  })
})
