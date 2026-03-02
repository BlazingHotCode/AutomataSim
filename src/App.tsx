import { useEffect, useMemo, useState } from 'react'
import './App.css'
import { parseDeterministicFiniteAutomaton } from './lib/parseAutomaton'
import { simulateDFA } from './lib/simulateDFA'
import type {
  DeterministicFiniteAutomaton,
  DeterministicSimulationResult,
} from './types/automaton'

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

interface AutomatonGraphProps {
  machine: DeterministicFiniteAutomaton
  currentState?: string | null
  traversedStates?: Set<string>
  traversedTransitionKeys?: Set<string>
  activeTransitionKey?: string | null
}

function AutomatonGraph({
  machine,
  currentState = null,
  traversedStates = new Set<string>(),
  traversedTransitionKeys = new Set<string>(),
  activeTransitionKey = null,
}: AutomatonGraphProps) {
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
        const transitionKey = `${transition.from}|${transition.symbol}|${transition.to}`
        const isTraversed = traversedTransitionKeys.has(transitionKey)
        const isActive = activeTransitionKey === transitionKey
        const strokeColor = isActive ? '#d36b1f' : isTraversed ? '#2f7f4f' : '#2e4c76'
        const textColor = isActive ? '#8d3f08' : isTraversed ? '#1d5b34' : '#10284a'
        const strokeWidth = isActive ? 3 : 2

        if (isSelfLoop) {
          return (
            <g key={`${transition.from}-${transition.symbol}-self`}>
              <path
                d={`M ${from.x - 12} ${from.y - nodeRadius}
                    C ${from.x - 40} ${from.y - 75},
                      ${from.x + 40} ${from.y - 75},
                      ${from.x + 12} ${from.y - nodeRadius}`}
                fill="none"
                stroke={strokeColor}
                strokeWidth={strokeWidth}
                markerEnd="url(#arrow)"
              />
              <text
                x={from.x}
                y={from.y - 78}
                textAnchor="middle"
                fill={textColor}
              >
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
              stroke={strokeColor}
              strokeWidth={strokeWidth}
              markerEnd="url(#arrow)"
            />
            <text x={labelX} y={labelY} textAnchor="middle" fill={textColor}>
              {transition.symbol}
            </text>
          </g>
        )
      })}

      {machine.states.map((state) => {
        const position = positions[state]
        const isAccepting = machine.acceptStates.includes(state)
        const isStart = machine.startState === state
        const isCurrent = currentState === state
        const isTraversed = traversedStates.has(state)

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
              className={[
                'state-node',
                isTraversed ? 'state-node-traversed' : '',
                isCurrent ? 'state-node-current' : '',
              ]
                .filter(Boolean)
                .join(' ')}
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
  const [inputString, setInputString] = useState('')
  const [simulationResult, setSimulationResult] =
    useState<DeterministicSimulationResult | null>(null)
  const [activeStepIndex, setActiveStepIndex] = useState(-1)
  const [isAutoPlaying, setIsAutoPlaying] = useState(false)

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
    setSimulationResult(null)
    setActiveStepIndex(-1)
    setIsAutoPlaying(false)
  }

  function handleRunSimulation() {
    if (selectedAutomatonType !== 'deterministicFiniteAutomaton') {
      return
    }

    if (!parseResult?.value) {
      setSimulationResult(null)
      setActiveStepIndex(-1)
      setIsAutoPlaying(false)
      return
    }

    const nextResult = simulateDFA(parseResult.value, inputString)
    setSimulationResult(nextResult)
    setActiveStepIndex(nextResult.trace.length - 1)
    setIsAutoPlaying(false)
  }

  const totalTraceSteps = simulationResult?.trace.length ?? 0
  const canStepBackward = simulationResult !== null && activeStepIndex >= 0
  const canStepForward =
    simulationResult !== null && activeStepIndex < totalTraceSteps - 1
  const canAutoPlay = simulationResult !== null && totalTraceSteps > 0
  const activeState =
    simulationResult === null
      ? null
      : activeStepIndex >= 0
        ? simulationResult.trace[activeStepIndex].toState
        : simulationResult.startState
  const traversedSteps =
    simulationResult === null || activeStepIndex < 0
      ? []
      : simulationResult.trace.slice(0, activeStepIndex + 1)
  const traversedTransitionKeys = new Set(
    traversedSteps.map(
      (step) => `${step.fromState}|${step.symbol}|${step.toState}`,
    ),
  )
  const traversedStates = new Set([
    ...(simulationResult ? [simulationResult.startState] : []),
    ...traversedSteps.map((step) => step.toState),
  ])
  const activeTransitionKey =
    simulationResult !== null && activeStepIndex >= 0
      ? `${simulationResult.trace[activeStepIndex].fromState}|${simulationResult.trace[activeStepIndex].symbol}|${simulationResult.trace[activeStepIndex].toState}`
      : null

  useEffect(() => {
    if (!isAutoPlaying) {
      return
    }

    if (!simulationResult || simulationResult.trace.length === 0) {
      return
    }

    if (activeStepIndex >= simulationResult.trace.length - 1) {
      return
    }

    const timer = window.setTimeout(() => {
      setActiveStepIndex((value) => {
        const maxIndex = simulationResult.trace.length - 1
        const nextValue = Math.min(value + 1, maxIndex)
        if (nextValue >= maxIndex) {
          setIsAutoPlaying(false)
        }
        return nextValue
      })
    }, 700)

    return () => window.clearTimeout(timer)
  }, [activeStepIndex, isAutoPlaying, simulationResult])

  function handleStartAutoPlay() {
    if (!canAutoPlay) {
      return
    }

    if (activeStepIndex >= totalTraceSteps - 1) {
      setActiveStepIndex(-1)
    }
    setIsAutoPlaying(true)
  }

  function handleResetSimulationProgress() {
    setIsAutoPlaying(false)
    setActiveStepIndex(-1)
  }

  function handleClearSimulation() {
    setIsAutoPlaying(false)
    setActiveStepIndex(-1)
    setSimulationResult(null)
    setInputString('')
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
            onChange={(event) => {
              setSelectedAutomatonType(event.target.value as AutomatonType)
              setSimulationResult(null)
              setActiveStepIndex(-1)
              setIsAutoPlaying(false)
            }}
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

          {selectedOption.supported && (
            <div className="simulation-controls">
              <h2>Simulation</h2>
              <label className="selector-label" htmlFor="inputString">
                Input String
              </label>
              <input
                id="inputString"
                className="string-input"
                type="text"
                value={inputString}
                onChange={(event) => {
                  setInputString(event.target.value)
                  setSimulationResult(null)
                  setActiveStepIndex(-1)
                  setIsAutoPlaying(false)
                }}
                placeholder="Example: 10101 or a b a"
              />
              <button
                className="run-button"
                type="button"
                onClick={handleRunSimulation}
                disabled={!parseResult?.value}
              >
                Run
              </button>
              <div className="simulation-actions">
                <button
                  className="action-button"
                  type="button"
                  onClick={handleResetSimulationProgress}
                  disabled={
                    simulationResult === null ||
                    (activeStepIndex < 0 && !isAutoPlaying)
                  }
                >
                  Reset Progress
                </button>
                <button
                  className="action-button"
                  type="button"
                  onClick={handleClearSimulation}
                  disabled={
                    inputString.length === 0 &&
                    simulationResult === null &&
                    activeStepIndex < 0 &&
                    !isAutoPlaying
                  }
                >
                  Clear Simulation
                </button>
              </div>

              {!parseResult?.value && (
                <div className="simulation-error-box" role="alert">
                  <h3>Cannot Run Simulation</h3>
                  <p>Fix the machine definition errors before running.</p>
                  <ul>
                    {parseResult?.errors.map((error) => (
                      <li key={error}>{error}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>

        <div>
          <h2>Rendered Automaton</h2>
          {selectedOption.supported && parseResult?.value ? (
            <AutomatonGraph
              machine={parseResult.value}
              currentState={activeState}
              traversedStates={traversedStates}
              traversedTransitionKeys={traversedTransitionKeys}
              activeTransitionKey={activeTransitionKey}
            />
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

          {selectedOption.supported && simulationResult && (
            <div className="graph-legend">
              <span className="legend-item">
                <span className="legend-swatch legend-current" />
                Current state/step
              </span>
              <span className="legend-item">
                <span className="legend-swatch legend-path" />
                Path taken
              </span>
            </div>
          )}

          {selectedOption.supported && simulationResult && (
            <div
              className={
                simulationResult.accepted &&
                simulationResult.errors.length === 0
                  ? 'simulation-result simulation-result-accept'
                  : 'simulation-result simulation-result-reject'
              }
            >
              <h3>
                Result:
                {' '}
                {simulationResult.accepted &&
                simulationResult.errors.length === 0
                  ? 'Accept'
                  : 'Reject'}
              </h3>
              <p>
                Final state:
                {' '}
                <strong>{simulationResult.finalState}</strong>
              </p>
              {simulationResult.errors.length > 0 && (
                <ul>
                  {simulationResult.errors.map((error) => (
                    <li key={error}>{error}</li>
                  ))}
                </ul>
              )}

              <div className="step-runner">
                <h4>Step Runner</h4>
                <p>
                  Step:
                  {' '}
                  <strong>
                    {Math.max(0, activeStepIndex + 1)}
                    /
                    {totalTraceSteps}
                  </strong>
                  {' '}
                  | Current state:
                  {' '}
                  <strong>{activeState}</strong>
                </p>
                <div className="step-controls">
                  <button
                    className="step-button"
                    type="button"
                    onClick={() => setActiveStepIndex((value) => value - 1)}
                    disabled={!canStepBackward || isAutoPlaying}
                  >
                    Previous
                  </button>
                  <button
                    className="step-button"
                    type="button"
                    onClick={() => setActiveStepIndex((value) => value + 1)}
                    disabled={!canStepForward || isAutoPlaying}
                  >
                    Next
                  </button>
                  <button
                    className="step-button"
                    type="button"
                    onClick={handleStartAutoPlay}
                    disabled={!canAutoPlay || isAutoPlaying}
                  >
                    Auto-play
                  </button>
                  <button
                    className="step-button"
                    type="button"
                    onClick={() => setIsAutoPlaying(false)}
                    disabled={!isAutoPlaying}
                  >
                    Pause
                  </button>
                  <button
                    className="step-button"
                    type="button"
                    onClick={handleResetSimulationProgress}
                    disabled={simulationResult.trace.length === 0 && activeStepIndex < 0}
                  >
                    Reset
                  </button>
                </div>

                {simulationResult.trace.length > 0 ? (
                  <ol className="trace-list">
                    {simulationResult.trace.map((step, index) => (
                      <li
                        key={`${step.index}-${step.symbol}-${step.fromState}-${step.toState}`}
                        className={index === activeStepIndex ? 'trace-active' : ''}
                      >
                        Read
                        {' '}
                        <strong>{step.symbol}</strong>
                        :
                        {' '}
                        {step.fromState}
                        {' -> '}
                        {step.toState}
                      </li>
                    ))}
                  </ol>
                ) : (
                  <p className="trace-empty">No transition steps to display.</p>
                )}
              </div>
            </div>
          )}
        </div>
      </section>
    </main>
  )
}

export default App
