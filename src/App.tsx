import { useMemo, useState } from 'react'
import './App.css'
import { parseDeterministicFiniteAutomaton } from './lib/parseAutomaton'
import type { DeterministicFiniteAutomaton } from './types/automaton'

type AutomatonType =
  | 'deterministicFiniteAutomaton'
  | 'nondeterministicFiniteAutomaton'
  | 'pushdownAutomaton'
  | 'queueAutomaton'
  | 'turingMachine'

interface AutomatonOption {
  id: AutomatonType
  label: string
  supported: boolean
}

const AUTOMATON_OPTIONS: AutomatonOption[] = [
  {
    id: 'deterministicFiniteAutomaton',
    label: 'Deterministic Finite Automaton',
    supported: true,
  },
  {
    id: 'nondeterministicFiniteAutomaton',
    label: 'Nondeterministic Finite Automaton',
    supported: false,
  },
  {
    id: 'pushdownAutomaton',
    label: 'Pushdown Automaton',
    supported: false,
  },
  {
    id: 'queueAutomaton',
    label: 'Queue Automaton',
    supported: false,
  },
  {
    id: 'turingMachine',
    label: 'Turing Machine',
    supported: false,
  },
]

const DETERMINISTIC_SAMPLE = `states: q0,q1,q2
alphabet: 0,1
start: q0
accept: q2
transitions:
q0,0 -> q0
q0,1 -> q1
q1,0 -> q2
q1,1 -> q1
q2,0 -> q2
q2,1 -> q2`

const FUTURE_TEMPLATE = `# Format for this automaton type will be added here.
# This mode is planned but not implemented yet.`

function getStatePositions(states: string[]) {
  const width = 720
  const height = 360
  const radius = Math.min(width, height) * 0.32
  const centerX = width / 2
  const centerY = height / 2

  return states.reduce<Record<string, { x: number; y: number }>>(
    (accumulator, state, index) => {
      const angle = (index / states.length) * Math.PI * 2 - Math.PI / 2
      accumulator[state] = {
        x: centerX + radius * Math.cos(angle),
        y: centerY + radius * Math.sin(angle),
      }
      return accumulator
    },
    {},
  )
}

function AutomatonGraph({ machine }: { machine: DeterministicFiniteAutomaton }) {
  const positions = getStatePositions(machine.states)
  const nodeRadius = 28

  return (
    <svg viewBox="0 0 720 360" className="automaton-canvas" role="img">
      <defs>
        <marker
          id="arrow"
          markerWidth="8"
          markerHeight="8"
          refX="7"
          refY="4"
          orient="auto"
        >
          <path d="M0,0 L8,4 L0,8 Z" fill="#2e4c76" />
        </marker>
      </defs>

      {machine.transitions.map((transition) => {
        const from = positions[transition.from]
        const to = positions[transition.to]
        const isSelfLoop = transition.from === transition.to

        if (isSelfLoop) {
          return (
            <g key={`${transition.from}-${transition.symbol}-self`}>
              <path
                d={`M ${from.x - 12} ${from.y - nodeRadius}
                    C ${from.x - 40} ${from.y - 75},
                      ${from.x + 40} ${from.y - 75},
                      ${from.x + 12} ${from.y - nodeRadius}`}
                fill="none"
                stroke="#2e4c76"
                strokeWidth="2"
                markerEnd="url(#arrow)"
              />
              <text x={from.x} y={from.y - 78} textAnchor="middle">
                {transition.symbol}
              </text>
            </g>
          )
        }

        const dx = to.x - from.x
        const dy = to.y - from.y
        const length = Math.hypot(dx, dy)
        const unitX = dx / length
        const unitY = dy / length
        const startX = from.x + unitX * nodeRadius
        const startY = from.y + unitY * nodeRadius
        const endX = to.x - unitX * nodeRadius
        const endY = to.y - unitY * nodeRadius
        const labelX = (startX + endX) / 2 + -unitY * 12
        const labelY = (startY + endY) / 2 + unitX * 12

        return (
          <g key={`${transition.from}-${transition.symbol}-${transition.to}`}>
            <line
              x1={startX}
              y1={startY}
              x2={endX}
              y2={endY}
              stroke="#2e4c76"
              strokeWidth="2"
              markerEnd="url(#arrow)"
            />
            <text x={labelX} y={labelY} textAnchor="middle">
              {transition.symbol}
            </text>
          </g>
        )
      })}

      {machine.states.map((state) => {
        const position = positions[state]
        const isAccepting = machine.acceptStates.includes(state)
        const isStart = machine.startState === state

        return (
          <g key={state}>
            {isStart && (
              <line
                x1={position.x - 70}
                y1={position.y}
                x2={position.x - nodeRadius}
                y2={position.y}
                stroke="#2e4c76"
                strokeWidth="2"
                markerEnd="url(#arrow)"
              />
            )}
            <circle
              cx={position.x}
              cy={position.y}
              r={nodeRadius}
              className="state-node"
            />
            {isAccepting && (
              <circle
                cx={position.x}
                cy={position.y}
                r={nodeRadius - 6}
                className="state-node-accept"
              />
            )}
            <text x={position.x} y={position.y + 4} textAnchor="middle">
              {state}
            </text>
          </g>
        )
      })}
    </svg>
  )
}

function App() {
  const [selectedAutomatonType, setSelectedAutomatonType] =
    useState<AutomatonType>('deterministicFiniteAutomaton')
  const [definitionsByType, setDefinitionsByType] = useState<
    Record<AutomatonType, string>
  >({
    deterministicFiniteAutomaton: DETERMINISTIC_SAMPLE,
    nondeterministicFiniteAutomaton: FUTURE_TEMPLATE,
    pushdownAutomaton: FUTURE_TEMPLATE,
    queueAutomaton: FUTURE_TEMPLATE,
    turingMachine: FUTURE_TEMPLATE,
  })

  const selectedOption = AUTOMATON_OPTIONS.find(
    (option) => option.id === selectedAutomatonType,
  )!
  const definitionText = definitionsByType[selectedAutomatonType]
  const parseResult = useMemo(() => {
    if (selectedAutomatonType !== 'deterministicFiniteAutomaton') {
      return null
    }
    return parseDeterministicFiniteAutomaton(definitionText)
  }, [definitionText, selectedAutomatonType])

  function handleDefinitionChange(nextDefinition: string) {
    setDefinitionsByType((currentValue) => ({
      ...currentValue,
      [selectedAutomatonType]: nextDefinition,
    }))
  }

  return (
    <main className="app-shell">
      <section className="hero">
        <p className="eyebrow">AutomataSim</p>
        <h1>Text-to-Automaton Renderer</h1>
        <p className="subtitle">
          Define a Deterministic Finite Automaton as text, and the diagram is
          rendered automatically.
        </p>
      </section>

      <section className="panel editor-grid">
        <div>
          <label className="selector-label" htmlFor="automatonType">
            Automaton Type
          </label>
          <select
            id="automatonType"
            className="type-selector"
            value={selectedAutomatonType}
            onChange={(event) =>
              setSelectedAutomatonType(event.target.value as AutomatonType)
            }
          >
            {AUTOMATON_OPTIONS.map((option) => (
              <option key={option.id} value={option.id}>
                {option.label}
              </option>
            ))}
          </select>

          <h2>Automaton Definition</h2>
          <p className="hint">
            {selectedOption.supported
              ? 'Format: `states`, `alphabet`, `start`, `accept`, then `transitions`. Transition syntax: `source,symbol -> target`'
              : `The ${selectedOption.label} parser format is not implemented yet.`}
          </p>
          <textarea
            className="definition-input"
            value={definitionText}
            onChange={(event) => handleDefinitionChange(event.target.value)}
            spellCheck={false}
          />
        </div>

        <div>
          <h2>Rendered Automaton</h2>
          {selectedOption.supported && parseResult?.value ? (
            <AutomatonGraph machine={parseResult.value} />
          ) : selectedOption.supported ? (
            <div className="error-box">
              <h3>Definition Errors</h3>
              <ul>
                {parseResult?.errors.map((error) => (
                  <li key={error}>{error}</li>
                ))}
              </ul>
            </div>
          ) : (
            <div className="info-box">
              <h3>Coming Soon</h3>
              <p>
                {selectedOption.label}
                {' '}
                support is planned in the roadmap.
              </p>
            </div>
          )}
        </div>
      </section>
    </main>
  )
}

export default App
