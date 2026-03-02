import type { ChangeEvent, FC, RefObject } from 'react'
import SimulationControls from './SimulationControls'
import TransferControls from './TransferControls'
import type { AutomatonOption, AutomatonType } from '../types/uiState'

interface AutomatonEditorPanelProps {
  selectedAutomatonType: AutomatonType
  selectedOption: AutomatonOption
  automatonOptions: readonly AutomatonOption[]
  definitionText: string
  onAutomatonTypeChange: (value: AutomatonType) => void
  onDefinitionChange: (value: string) => void
  onExport: () => void
  onTriggerImport: () => void
  onImportFile: (event: ChangeEvent<HTMLInputElement>) => void
  importFileInputRef: RefObject<HTMLInputElement | null>
  transferMessage: string | null
  transferMessageKind: 'success' | 'error'
  transferErrorDetails: string[]
  showSimulationControls: boolean
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

function getDefinitionHint(
  selectedAutomatonType: AutomatonType,
  selectedOption: AutomatonOption,
): string {
  if (selectedAutomatonType === 'deterministicFiniteAutomaton') {
    return 'Format: `states`, `alphabet`, `start`, `accept`, then `transitions`. Transition syntax: `source,symbol -> target`'
  }
  if (selectedAutomatonType === 'nondeterministicFiniteAutomaton') {
    return 'Format: `states`, `alphabet`, `start`, `accept`, then `transitions`. Transition syntax: `source,symbol -> targetA|targetB` (epsilon accepted as `e`, `eps`, `epsilon`, or `ε`).'
  }
  if (selectedAutomatonType === 'pushdownAutomaton') {
    return 'Format: add `stackAlphabet` and `stackStart`. Transition syntax: `source,input,pop -> target,pushA|pushB` (use `e`/`eps`/`epsilon`/`ε` for epsilon).'
  }
  if (selectedAutomatonType === 'queueAutomaton') {
    return 'Format: add `queueAlphabet` and `queueStart`. Transition syntax: `source,input,dequeue -> target,enqueue` (epsilon accepted as `e`/`eps`/`epsilon`/`ε`).'
  }
  if (selectedAutomatonType === 'turingMachine') {
    return 'Format: add `tapeAlphabet` and `blank`. Transition syntax: `source,read -> target,write,Move` where Move is L/R/S.'
  }

  return `The ${selectedOption.label} parser format is not implemented yet.`
}

const AutomatonEditorPanel: FC<AutomatonEditorPanelProps> = ({
  selectedAutomatonType,
  selectedOption,
  automatonOptions,
  definitionText,
  onAutomatonTypeChange,
  onDefinitionChange,
  onExport,
  onTriggerImport,
  onImportFile,
  importFileInputRef,
  transferMessage,
  transferMessageKind,
  transferErrorDetails,
  showSimulationControls,
  inputString,
  onInputChange,
  onRun,
  canRun,
  onResetProgress,
  onClear,
  disableResetProgress,
  disableClear,
  parseErrors,
}) => {
  return (
    <div>
      <label className="selector-label" htmlFor="automatonType">
        Automaton Type
      </label>
      <select
        id="automatonType"
        className="type-selector"
        value={selectedAutomatonType}
        onChange={(event) => onAutomatonTypeChange(event.target.value as AutomatonType)}
      >
        {automatonOptions.map((option) => (
          <option key={option.id} value={option.id}>
            {option.label}
          </option>
        ))}
      </select>

      <h2>Automaton Definition</h2>
      <p className="hint">{getDefinitionHint(selectedAutomatonType, selectedOption)}</p>
      <textarea
        className="definition-input"
        value={definitionText}
        onChange={(event) => onDefinitionChange(event.target.value)}
        spellCheck={false}
      />

      <TransferControls
        onExport={onExport}
        onTriggerImport={onTriggerImport}
        onImportFile={onImportFile}
        importFileInputRef={importFileInputRef}
        transferMessage={transferMessage}
        transferMessageKind={transferMessageKind}
        transferErrorDetails={transferErrorDetails}
      />

      {showSimulationControls && (
        <SimulationControls
          inputString={inputString}
          onInputChange={onInputChange}
          onRun={onRun}
          canRun={canRun}
          onResetProgress={onResetProgress}
          onClear={onClear}
          disableResetProgress={disableResetProgress}
          disableClear={disableClear}
          parseErrors={parseErrors}
        />
      )}
    </div>
  )
}

export default AutomatonEditorPanel
