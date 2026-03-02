import { describe, expect, it } from 'vitest'
import type { TuringMachine } from '../types/automaton'
import { simulateTuringMachine } from './simulateTM'

const tm: TuringMachine = {
  states: ['q0', 'qAccept'],
  alphabet: ['0', '1'],
  tapeAlphabet: ['0', '1', '_'],
  blankSymbol: '_',
  startState: 'q0',
  acceptStates: ['qAccept'],
  transitions: [
    { from: 'q0', readSymbol: '0', to: 'q0', writeSymbol: '1', move: 'R' },
    { from: 'q0', readSymbol: '1', to: 'q0', writeSymbol: '0', move: 'R' },
    { from: 'q0', readSymbol: '_', to: 'qAccept', writeSymbol: '_', move: 'S' },
  ],
}

describe('simulateTuringMachine', () => {
  it('accepts and halts on accept state', () => {
    const result = simulateTuringMachine(tm, '01')
    expect(result.errors).toEqual([])
    expect(result.accepted).toBe(true)
    expect(result.haltedReason).toBe('accept')
  })

  it('enforces step limit safeguard', () => {
    const looping: TuringMachine = {
      ...tm,
      transitions: [
        { from: 'q0', readSymbol: '0', to: 'q0', writeSymbol: '0', move: 'R' },
        { from: 'q0', readSymbol: '_', to: 'q0', writeSymbol: '_', move: 'R' },
      ],
    }
    const result = simulateTuringMachine(looping, '0', 3)
    expect(result.accepted).toBe(false)
    expect(result.haltedReason).toBe('step_limit')
  })
})
