interface SimulationControlsProps {
  inputString: string
  onInputChange: (value: string) => void
  onRun: () => void
  canRun: boolean
  onResetProgress: () => void
  onClear: () => void
  disableResetProgress: boolean
  disableClear: boolean
  parseErrors: string[]
}

function SimulationControls({
  inputString,
  onInputChange,
  onRun,
  canRun,
  onResetProgress,
  onClear,
  disableResetProgress,
  disableClear,
  parseErrors,
}: SimulationControlsProps) {
  return (
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
        onChange={(event) => onInputChange(event.target.value)}
        placeholder="Example: 10101 or a b a"
      />
      <button
        className="run-button"
        type="button"
        onClick={onRun}
        disabled={!canRun}
      >
        Run
      </button>
      <div className="simulation-actions">
        <button
          className="action-button"
          type="button"
          onClick={onResetProgress}
          disabled={disableResetProgress}
        >
          Reset Progress
        </button>
        <button
          className="action-button"
          type="button"
          onClick={onClear}
          disabled={disableClear}
        >
          Clear Simulation
        </button>
      </div>

      {!canRun && (
        <div className="simulation-error-box" role="alert">
          <h3>Cannot Run Simulation</h3>
          <p>Fix the machine definition errors before running.</p>
          <ul>
            {parseErrors.map((error) => (
              <li key={error}>{error}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}

export default SimulationControls
