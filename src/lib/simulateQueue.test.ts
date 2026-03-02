import { describe, expect, it } from 'vitest'
import type { QueueAutomaton } from '../types/automaton'
import { simulateQueueAutomaton } from './simulateQueue'

const machine: QueueAutomaton = {
  states: ['q0', 'q1'],
  alphabet: ['a', 'b'],
  queueAlphabet: ['Z', 'a', 'b'],
  queueStartSymbol: 'Z',
  startState: 'q0',
  acceptStates: ['q1'],
  transitions: [
    { from: 'q0', inputSymbol: 'a', dequeueSymbol: 'Z', to: 'q0', enqueueSymbol: 'a' },
    { from: 'q0', inputSymbol: 'a', dequeueSymbol: 'e', to: 'q0', enqueueSymbol: 'a' },
    { from: 'q0', inputSymbol: 'b', dequeueSymbol: 'a', to: 'q0', enqueueSymbol: 'e' },
    { from: 'q0', inputSymbol: 'e', dequeueSymbol: 'e', to: 'q1', enqueueSymbol: 'e' },
  ],
}

describe('simulateQueueAutomaton', () => {
  it('accepts matching pushes and pops', () => {
    const result = simulateQueueAutomaton(machine, 'aabb')
    expect(result.errors).toEqual([])
    expect(result.accepted).toBe(true)
  })

  it('rejects invalid queue consumption', () => {
    const result = simulateQueueAutomaton(machine, 'abbb')
    expect(result.accepted).toBe(false)
    expect(result.errors.length).toBeGreaterThan(0)
  })
})
