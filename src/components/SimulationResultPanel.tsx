import type { DeterministicSimulationResult } from '../types/automaton'

interface SimulationResultPanelProps {
  simulationResult: DeterministicSimulationResult
  activeStepIndex: number
  totalTraceSteps: number
  activeState: string | null
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
  activeState,
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
        Final state: <strong>{simulationResult.finalState}</strong>
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
          </strong>{' '}
          | Current state: <strong>{activeState}</strong>
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
            {simulationResult.trace.map((step, index) => (
              <li
                key={`${step.index}-${step.symbol}-${step.fromState}-${step.toState}`}
                className={index === activeStepIndex ? 'trace-active' : ''}
              >
                Read <strong>{step.symbol}</strong>: {step.fromState}
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
  )
}

export default SimulationResultPanel
