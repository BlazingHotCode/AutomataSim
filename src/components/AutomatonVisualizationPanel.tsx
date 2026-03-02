import type { FC } from 'react'
import AutomatonGraph from './AutomatonGraph'
import SimulationResultPanel from './SimulationResultPanel'
import type {
  DeterministicFiniteAutomaton,
  DeterministicSimulationResult,
  NondeterministicSimulationResult,
  PushdownSimulationResult,
  QueueSimulationResult,
  TuringSimulationResult,
} from '../types/automaton'
import type { AutomatonOption } from '../types/uiState'

interface SimulationPanelProps {
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

interface AutomatonVisualizationPanelProps {
  selectedOption: AutomatonOption
  graphMachine: DeterministicFiniteAutomaton | null
  activeParseErrors: string[]
  activeStates: Set<string>
  traversedStates: Set<string>
  traversedTransitionKeys: Set<string>
  activeTransitionKey: string | null
  simulationPanelProps: SimulationPanelProps | null
}

const AutomatonVisualizationPanel: FC<AutomatonVisualizationPanelProps> = ({
  selectedOption,
  graphMachine,
  activeParseErrors,
  activeStates,
  traversedStates,
  traversedTransitionKeys,
  activeTransitionKey,
  simulationPanelProps,
}) => {
  return (
    <div>
      <h2>Rendered Automaton</h2>
      {selectedOption.supported && graphMachine ? (
        <AutomatonGraph
          machine={graphMachine}
          currentStates={activeStates}
          traversedStates={traversedStates}
          traversedTransitionKeys={traversedTransitionKeys}
          activeTransitionKey={activeTransitionKey}
        />
      ) : selectedOption.supported ? (
        <div className="error-box">
          <h3>Definition Errors</h3>
          <ul>
            {activeParseErrors.map((error) => (
              <li key={error}>{error}</li>
            ))}
          </ul>
        </div>
      ) : (
        <div className="info-box">
          <h3>Coming Soon</h3>
          <p>{selectedOption.label} support is planned in the roadmap.</p>
        </div>
      )}

      {selectedOption.supported && simulationPanelProps && (
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

      {selectedOption.supported && simulationPanelProps && (
        <SimulationResultPanel
          simulationResult={simulationPanelProps.simulationResult}
          activeStepIndex={simulationPanelProps.activeStepIndex}
          totalTraceSteps={simulationPanelProps.totalTraceSteps}
          activeStateLabel={simulationPanelProps.activeStateLabel}
          canStepBackward={simulationPanelProps.canStepBackward}
          canStepForward={simulationPanelProps.canStepForward}
          canAutoPlay={simulationPanelProps.canAutoPlay}
          isAutoPlaying={simulationPanelProps.isAutoPlaying}
          onPrevious={simulationPanelProps.onPrevious}
          onNext={simulationPanelProps.onNext}
          onAutoPlay={simulationPanelProps.onAutoPlay}
          onPause={simulationPanelProps.onPause}
          onReset={simulationPanelProps.onReset}
        />
      )}
    </div>
  )
}

export default AutomatonVisualizationPanel
