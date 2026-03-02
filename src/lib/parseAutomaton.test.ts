import { describe, expect, it } from 'vitest'
import {
  parseDeterministicFiniteAutomaton,
  parseNondeterministicFiniteAutomaton,
  parsePushdownAutomaton,
  parseQueueAutomaton,
  parseTuringMachine,
} from './parseAutomaton'

describe('parseAutomaton', () => {
  it('parses deterministic definitions', () => {
    const text = `states: q0,q1
alphabet: 0,1
start: q0
accept: q1
transitions:
q0,0 -> q0
q0,1 -> q1
q1,0 -> q0
q1,1 -> q1`

    const result = parseDeterministicFiniteAutomaton(text)

    expect(result.errors).toEqual([])
    expect(result.value).not.toBeNull()
    expect(result.value?.transitions).toHaveLength(4)
  })

  it('parses nondeterministic transitions and epsilon aliases', () => {
    const text = `states: q0,q1,q2
alphabet: 0,1
start: q0
accept: q2
transitions:
q0,eps -> q1
q0,e -> q2
q1,0 -> q1|q2
q1,1 -> q2
q2,0 -> q2
q2,1 -> q2`

    const result = parseNondeterministicFiniteAutomaton(text)

    expect(result.errors).toEqual([])
    expect(result.value).not.toBeNull()
    expect(result.value?.transitions.find((t) => t.symbol === 'eps')).toEqual({
      from: 'q0',
      symbol: 'eps',
      to: ['q1'],
    })
    expect(result.value?.transitions.find((t) => t.symbol === 'e')).toEqual({
      from: 'q0',
      symbol: 'e',
      to: ['q2'],
    })
  })

  it('returns a clear error for invalid NFA symbols', () => {
    const text = `states: q0,q1
alphabet: 0,1
start: q0
accept: q1
transitions:
q0,x -> q1
q0,1 -> q1`

    const result = parseNondeterministicFiniteAutomaton(text)

    expect(result.value).toBeNull()
    expect(result.errors).toContain(
      'Transition symbol "x" is not in alphabet or epsilon.',
    )
  })

  it('parses pushdown automaton definitions', () => {
    const text = `states: q0,q1
alphabet: a,b
stackAlphabet: Z,A
stackStart: Z
start: q0
accept: q1
transitions:
q0,a,Z -> q0,A|Z
q0,b,A -> q0,eps
q0,e,Z -> q1,Z`

    const result = parsePushdownAutomaton(text)
    expect(result.errors).toEqual([])
    expect(result.value).not.toBeNull()
    expect(result.value?.transitions).toHaveLength(3)
  })

  it('parses queue automaton definitions', () => {
    const text = `states: q0,q1
alphabet: a,b
queueAlphabet: Z,a
queueStart: Z
start: q0
accept: q1
transitions:
q0,a,e -> q0,a
q0,b,a -> q0,e
q0,e,Z -> q1,Z`

    const result = parseQueueAutomaton(text)
    expect(result.errors).toEqual([])
    expect(result.value).not.toBeNull()
  })

  it('parses turing machine definitions', () => {
    const text = `states: q0,qAccept
alphabet: 0,1
tapeAlphabet: 0,1,_
blank: _
start: q0
accept: qAccept
transitions:
q0,0 -> q0,1,R
q0,1 -> q0,0,R
q0,_ -> qAccept,_,S`

    const result = parseTuringMachine(text)
    expect(result.errors).toEqual([])
    expect(result.value).not.toBeNull()
    expect(result.value?.transitions).toHaveLength(3)
  })
})
