import type {
  DeterministicSimulationResult,
  NondeterministicSimulationResult,
  PushdownSimulationResult,
  QueueSimulationResult,
  TuringSimulationResult,
} from '../types/automaton'

interface SimulationResultPanelProps {
  simulationResult:
    | DeterministicSimulationResult
    | NondeterministicSimulationResult
    | PushdownSimulationResult
    | QueueSimulationResult
    | TuringSimulationResult
  activeStepIndex: number
  totalTraceSteps: number
  activeStateLabel: string | null
  canStepBackward: boolean
  canStepForward: boolean
  canAutoPlay: boolean
  isAutoPlaying: boolean
  onPrevious: () => void
  onNext: () => void
  onAutoPlay: () => void
  onPause: () => void
  onReset: () => void
}

function SimulationResultPanel({
  simulationResult,
  activeStepIndex,
  totalTraceSteps,
  activeStateLabel,
  canStepBackward,
  canStepForward,
  canAutoPlay,
  isAutoPlaying,
  onPrevious,
  onNext,
  onAutoPlay,
  onPause,
  onReset,
}: SimulationResultPanelProps) {
  const isDeterministic =
    'finalState' in simulationResult &&
    !('stackBefore' in (simulationResult.trace[0] ?? {})) &&
    !('queueBefore' in (simulationResult.trace[0] ?? {})) &&
    !('readSymbol' in (simulationResult.trace[0] ?? {}))
  const isPushdown =
    'finalState' in simulationResult &&
    'stackBefore' in (simulationResult.trace[0] ?? {})
  const isQueue =
    'finalState' in simulationResult &&
    'queueBefore' in (simulationResult.trace[0] ?? {})
  const isTuring =
    'finalState' in simulationResult &&
    'readSymbol' in (simulationResult.trace[0] ?? {})
  const deterministicTrace = isDeterministic
    ? (simulationResult as DeterministicSimulationResult).trace
    : []
  const nondeterministicTrace = 'finalStates' in simulationResult
    ? simulationResult.trace
    : []
  const pushdownTrace = isPushdown
    ? (simulationResult as PushdownSimulationResult).trace
    : []
  const queueTrace = isQueue
    ? (simulationResult as QueueSimulationResult).trace
    : []
  const turingTrace = isTuring
    ? (simulationResult as TuringSimulationResult).trace
    : []
  const activePushdownStep =
    isPushdown && activeStepIndex >= 0 ? pushdownTrace[activeStepIndex] : null
  const activeQueueStep =
    isQueue && activeStepIndex >= 0 ? queueTrace[activeStepIndex] : null
  const activeTuringStep =
    isTuring && activeStepIndex >= 0 ? turingTrace[activeStepIndex] : null
  const finalStateLabel = isDeterministic
    ? simulationResult.finalState
    : 'finalStates' in simulationResult
      ? simulationResult.finalStates.join(', ') || '∅'
      : simulationResult.finalState

  return (
    <div
      className={
        simulationResult.accepted && simulationResult.errors.length === 0
          ? 'simulation-result simulation-result-accept'
          : 'simulation-result simulation-result-reject'
      }
    >
      <h3>
        Result:{' '}
        {simulationResult.accepted && simulationResult.errors.length === 0
          ? 'Accept'
          : 'Reject'}
      </h3>
      <p>
        Final state(s): <strong>{finalStateLabel}</strong>
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
          Step:{' '}
          <strong>
            {Math.max(0, activeStepIndex + 1)}/{totalTraceSteps}
          </strong>
          {' | '}
          Current state(s): <strong>{activeStateLabel ?? '∅'}</strong>
        </p>
        <div className="step-controls">
          <button
            className="step-button"
            type="button"
            onClick={onPrevious}
            disabled={!canStepBackward || isAutoPlaying}
          >
            Previous
          </button>
          <button
            className="step-button"
            type="button"
            onClick={onNext}
            disabled={!canStepForward || isAutoPlaying}
          >
            Next
          </button>
          <button
            className="step-button"
            type="button"
            onClick={onAutoPlay}
            disabled={!canAutoPlay || isAutoPlaying}
          >
            Auto-play
          </button>
          <button
            className="step-button"
            type="button"
            onClick={onPause}
            disabled={!isAutoPlaying}
          >
            Pause
          </button>
          <button
            className="step-button"
            type="button"
            onClick={onReset}
            disabled={
              simulationResult.trace.length === 0 && activeStepIndex < 0
            }
          >
            Reset
          </button>
        </div>

        {simulationResult.trace.length > 0 ? (
          <ol className="trace-list">
            {isDeterministic
              ? deterministicTrace.map((step, index) => (
                  <li
                    key={`${step.index}-${step.symbol}-${step.fromState}-${step.toState}`}
                    className={index === activeStepIndex ? 'trace-active' : ''}
                  >
                    Read <strong>{step.symbol}</strong>: {step.fromState}
                    {' -> '}
                    {step.toState}
                  </li>
                ))
              : 'finalStates' in simulationResult
                ? nondeterministicTrace.map((step, index) => (
                  <li
                    key={`${step.index}-${step.symbol}-${step.fromStates.join('|')}-${step.toStates.join('|')}`}
                    className={index === activeStepIndex ? 'trace-active' : ''}
                  >
                    Read <strong>{step.symbol}</strong>:{' '}
                    {step.fromStates.join(', ') || '∅'}
                    {' -> '}
                    {step.toStates.join(', ') || '∅'}
                  </li>
                  ))
                : isPushdown
                  ? pushdownTrace.map((step, index) => (
                      <li
                        key={`${step.index}-${step.inputSymbol}-${step.fromState}-${step.toState}`}
                        className={index === activeStepIndex ? 'trace-active' : ''}
                      >
                        Read <strong>{step.inputSymbol}</strong>, pop{' '}
                        <strong>{step.popSymbol}</strong>, push{' '}
                        <strong>{step.pushSymbols.join('|') || 'eps'}</strong>:{' '}
                        {step.fromState} {' -> '} {step.toState}
                      </li>
                    ))
                  : isQueue
                    ? queueTrace.map((step, index) => (
                        <li
                          key={`${step.index}-${step.inputSymbol}-${step.dequeueSymbol}-${step.enqueueSymbol}`}
                          className={index === activeStepIndex ? 'trace-active' : ''}
                        >
                          Read <strong>{step.inputSymbol}</strong>, dequeue{' '}
                          <strong>{step.dequeueSymbol}</strong>, enqueue{' '}
                          <strong>{step.enqueueSymbol}</strong>: {step.fromState}{' '}
                          {' -> '} {step.toState}
                        </li>
                      ))
                    : turingTrace.map((step, index) => (
                        <li
                          key={`${step.index}-${step.readSymbol}-${step.writeSymbol}-${step.move}`}
                          className={index === activeStepIndex ? 'trace-active' : ''}
                        >
                          Read <strong>{step.readSymbol}</strong>, write{' '}
                          <strong>{step.writeSymbol}</strong>, move{' '}
                          <strong>{step.move}</strong>: {step.fromState} {' -> '}{' '}
                          {step.toState}
                        </li>
                      ))}
          </ol>
        ) : (
          <p className="trace-empty">No transition steps to display.</p>
        )}
        {activePushdownStep && (
          <p>
            Stack:{' '}
            <strong>{activePushdownStep.stackAfter.join(' ') || 'empty'}</strong>
          </p>
        )}
        {activeQueueStep && (
          <p>
            Queue:{' '}
            <strong>{activeQueueStep.queueAfter.join(' ') || 'empty'}</strong>
          </p>
        )}
        {activeTuringStep && (
          <p>
            Tape:{' '}
            <strong>{activeTuringStep.tapeAfter.join(' ')}</strong> | Head:{' '}
            <strong>{activeTuringStep.headAfter}</strong>
          </p>
        )}
      </div>
    </div>
  )
}

export default SimulationResultPanel
