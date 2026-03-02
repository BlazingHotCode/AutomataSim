import { useEffect, useMemo, useRef, useState } from 'react'
import type { ChangeEvent } from 'react'
import './App.css'
import AutomatonGraph from './components/AutomatonGraph'
import SimulationControls from './components/SimulationControls'
import SimulationResultPanel from './components/SimulationResultPanel'
import TransferControls from './components/TransferControls'
import {
  buildUiStateFromImportedPayload,
  createExportPayload,
  validateImportedPayload,
} from './lib/configTransfer'
import { parseDeterministicFiniteAutomaton } from './lib/parseAutomaton'
import { simulateDFA } from './lib/simulateDFA'
import {
  AUTOMATON_OPTIONS,
  getDefaultUiStateByType,
  getDefinitionsByTypeFromUiState,
  loadPersistedUiConfig,
  LOCAL_STORAGE_KEY,
} from './lib/uiStateHelpers'
import type {
  AutomatonType,
  DeterministicUiState,
  UiStateByType,
} from './types/uiState'

function App() {
  const [persistedUiConfig] = useState(loadPersistedUiConfig)
  const [selectedAutomatonType, setSelectedAutomatonType] =
    useState<AutomatonType>(
      persistedUiConfig?.selectedAutomatonType ??
        'deterministicFiniteAutomaton',
    )
  const [uiStateByType, setUiStateByType] = useState<UiStateByType>({
    deterministicFiniteAutomaton: {
      definitionText:
        persistedUiConfig?.definitionsByType.deterministicFiniteAutomaton ??
        getDefaultUiStateByType().deterministicFiniteAutomaton.definitionText,
      inputString: persistedUiConfig?.deterministicInputString ?? '',
      simulationResult: null,
      activeStepIndex: -1,
      isAutoPlaying: false,
    },
    nondeterministicFiniteAutomaton: {
      definitionText:
        persistedUiConfig?.definitionsByType.nondeterministicFiniteAutomaton ??
        getDefaultUiStateByType().nondeterministicFiniteAutomaton
          .definitionText,
    },
    pushdownAutomaton: {
      definitionText:
        persistedUiConfig?.definitionsByType.pushdownAutomaton ??
        getDefaultUiStateByType().pushdownAutomaton.definitionText,
    },
    queueAutomaton: {
      definitionText:
        persistedUiConfig?.definitionsByType.queueAutomaton ??
        getDefaultUiStateByType().queueAutomaton.definitionText,
    },
    turingMachine: {
      definitionText:
        persistedUiConfig?.definitionsByType.turingMachine ??
        getDefaultUiStateByType().turingMachine.definitionText,
    },
  })
  const [transferMessage, setTransferMessage] = useState<string | null>(null)
  const [transferMessageKind, setTransferMessageKind] = useState<
    'success' | 'error'
  >('success')
  const [transferErrorDetails, setTransferErrorDetails] = useState<string[]>([])
  const importFileInputRef = useRef<HTMLInputElement | null>(null)

  const selectedOption = AUTOMATON_OPTIONS.find(
    (option) => option.id === selectedAutomatonType,
  )!
  const selectedUiState = uiStateByType[selectedAutomatonType]
  const definitionText = selectedUiState.definitionText
  const deterministicUiState =
    selectedAutomatonType === 'deterministicFiniteAutomaton'
      ? uiStateByType.deterministicFiniteAutomaton
      : null
  const inputString = deterministicUiState?.inputString ?? ''
  const simulationResult = deterministicUiState?.simulationResult ?? null
  const activeStepIndex = deterministicUiState?.activeStepIndex ?? -1
  const isAutoPlaying = deterministicUiState?.isAutoPlaying ?? false

  function updateDeterministicUiState(
    updater: (currentValue: DeterministicUiState) => DeterministicUiState,
  ) {
    setUiStateByType((currentValue) => ({
      ...currentValue,
      deterministicFiniteAutomaton: updater(
        currentValue.deterministicFiniteAutomaton,
      ),
    }))
  }

  function showTransferMessage(kind: 'success' | 'error', message: string) {
    setTransferMessageKind(kind)
    setTransferMessage(message)
    if (kind === 'success') {
      setTransferErrorDetails([])
    }
  }

  function showTransferErrors(message: string, details: string[]) {
    setTransferMessageKind('error')
    setTransferMessage(message)
    setTransferErrorDetails(details)
  }

  const parseResult = useMemo(() => {
    if (selectedAutomatonType !== 'deterministicFiniteAutomaton') {
      return null
    }
    return parseDeterministicFiniteAutomaton(definitionText)
  }, [definitionText, selectedAutomatonType])

  function handleDefinitionChange(nextDefinition: string) {
    setUiStateByType((currentValue) => {
      switch (selectedAutomatonType) {
        case 'deterministicFiniteAutomaton':
          return {
            ...currentValue,
            deterministicFiniteAutomaton: {
              ...currentValue.deterministicFiniteAutomaton,
              definitionText: nextDefinition,
              simulationResult: null,
              activeStepIndex: -1,
              isAutoPlaying: false,
            },
          }
        case 'nondeterministicFiniteAutomaton':
          return {
            ...currentValue,
            nondeterministicFiniteAutomaton: {
              ...currentValue.nondeterministicFiniteAutomaton,
              definitionText: nextDefinition,
            },
          }
        case 'pushdownAutomaton':
          return {
            ...currentValue,
            pushdownAutomaton: {
              ...currentValue.pushdownAutomaton,
              definitionText: nextDefinition,
            },
          }
        case 'queueAutomaton':
          return {
            ...currentValue,
            queueAutomaton: {
              ...currentValue.queueAutomaton,
              definitionText: nextDefinition,
            },
          }
        case 'turingMachine':
          return {
            ...currentValue,
            turingMachine: {
              ...currentValue.turingMachine,
              definitionText: nextDefinition,
            },
          }
      }
    })
  }

  function handleRunSimulation() {
    if (selectedAutomatonType !== 'deterministicFiniteAutomaton') {
      return
    }

    if (!parseResult?.value) {
      updateDeterministicUiState((currentValue) => ({
        ...currentValue,
        simulationResult: null,
        activeStepIndex: -1,
        isAutoPlaying: false,
      }))
      return
    }

    const nextResult = simulateDFA(parseResult.value, inputString)
    updateDeterministicUiState((currentValue) => ({
      ...currentValue,
      simulationResult: nextResult,
      activeStepIndex: nextResult.trace.length - 1,
      isAutoPlaying: false,
    }))
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
      updateDeterministicUiState((currentValue) => {
        const value = currentValue.activeStepIndex
        const maxIndex = simulationResult.trace.length - 1
        const nextValue = Math.min(value + 1, maxIndex)
        return {
          ...currentValue,
          activeStepIndex: nextValue,
          isAutoPlaying:
            nextValue >= maxIndex ? false : currentValue.isAutoPlaying,
        }
      })
    }, 700)

    return () => window.clearTimeout(timer)
  }, [activeStepIndex, isAutoPlaying, simulationResult])

  useEffect(() => {
    if (typeof window === 'undefined') {
      return
    }

    const payload = {
      selectedAutomatonType,
      definitionsByType: getDefinitionsByTypeFromUiState(uiStateByType),
      deterministicInputString:
        uiStateByType.deterministicFiniteAutomaton.inputString,
    }

    try {
      window.localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(payload))
    } catch {
      // Ignore storage failures (private mode/quota limits).
    }
  }, [selectedAutomatonType, uiStateByType])

  function handleExportJson() {
    const payload = createExportPayload(selectedAutomatonType, uiStateByType)
    const jsonText = JSON.stringify(payload, null, 2)
    const fileBlob = new Blob([jsonText], { type: 'application/json' })
    const objectUrl = window.URL.createObjectURL(fileBlob)
    const anchor = document.createElement('a')
    anchor.href = objectUrl
    anchor.download = 'automatasim-config.json'
    document.body.appendChild(anchor)
    anchor.click()
    anchor.remove()
    window.URL.revokeObjectURL(objectUrl)
    showTransferMessage('success', 'Exported JSON configuration.')
  }

  async function handleImportJsonFile(event: ChangeEvent<HTMLInputElement>) {
    const selectedFile = event.target.files?.[0]
    event.target.value = ''

    if (!selectedFile) {
      return
    }

    try {
      const fileText = await selectedFile.text()
      const parsed = JSON.parse(fileText) as unknown
      const validation = validateImportedPayload(
        parsed,
        AUTOMATON_OPTIONS.map((option) => option.id),
      )

      if (!validation.isValid) {
        showTransferErrors(
          'Import failed due to JSON validation errors.',
          validation.errors,
        )
        return
      }

      const parsedConfig = parsed as {
        selectedAutomatonType: AutomatonType
        definitionsByType: Partial<Record<AutomatonType, unknown>>
        deterministicInputString?: unknown
      }
      const imported = buildUiStateFromImportedPayload(parsedConfig)
      setUiStateByType(imported.uiStateByType)
      setSelectedAutomatonType(imported.selectedAutomatonType)
      showTransferMessage('success', 'Imported JSON configuration.')
    } catch {
      showTransferErrors('Failed to read JSON file.', [
        'File must contain valid JSON text.',
      ])
    }
  }

  function handleStartAutoPlay() {
    if (!canAutoPlay) {
      return
    }

    if (activeStepIndex >= totalTraceSteps - 1) {
      updateDeterministicUiState((currentValue) => ({
        ...currentValue,
        activeStepIndex: -1,
        isAutoPlaying: true,
      }))
      return
    }
    updateDeterministicUiState((currentValue) => ({
      ...currentValue,
      isAutoPlaying: true,
    }))
  }

  function handleResetSimulationProgress() {
    updateDeterministicUiState((currentValue) => ({
      ...currentValue,
      isAutoPlaying: false,
      activeStepIndex: -1,
    }))
  }

  function handleClearSimulation() {
    updateDeterministicUiState((currentValue) => ({
      ...currentValue,
      isAutoPlaying: false,
      activeStepIndex: -1,
      simulationResult: null,
      inputString: '',
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

          <TransferControls
            onExport={handleExportJson}
            onTriggerImport={() => importFileInputRef.current?.click()}
            onImportFile={handleImportJsonFile}
            importFileInputRef={importFileInputRef}
            transferMessage={transferMessage}
            transferMessageKind={transferMessageKind}
            transferErrorDetails={transferErrorDetails}
          />

          {selectedOption.supported && (
            <SimulationControls
              inputString={inputString}
              onInputChange={(value) => {
                updateDeterministicUiState((currentValue) => ({
                  ...currentValue,
                  inputString: value,
                  simulationResult: null,
                  activeStepIndex: -1,
                  isAutoPlaying: false,
                }))
              }}
              onRun={handleRunSimulation}
              canRun={Boolean(parseResult?.value)}
              onResetProgress={handleResetSimulationProgress}
              onClear={handleClearSimulation}
              disableResetProgress={
                simulationResult === null ||
                (activeStepIndex < 0 && !isAutoPlaying)
              }
              disableClear={
                inputString.length === 0 &&
                simulationResult === null &&
                activeStepIndex < 0 &&
                !isAutoPlaying
              }
              parseErrors={parseResult?.errors ?? []}
            />
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
              <p>{selectedOption.label} support is planned in the roadmap.</p>
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
            <SimulationResultPanel
              simulationResult={simulationResult}
              activeStepIndex={activeStepIndex}
              totalTraceSteps={totalTraceSteps}
              activeState={activeState}
              canStepBackward={canStepBackward}
              canStepForward={canStepForward}
              canAutoPlay={canAutoPlay}
              isAutoPlaying={isAutoPlaying}
              onPrevious={() =>
                updateDeterministicUiState((currentValue) => ({
                  ...currentValue,
                  activeStepIndex: currentValue.activeStepIndex - 1,
                }))
              }
              onNext={() =>
                updateDeterministicUiState((currentValue) => ({
                  ...currentValue,
                  activeStepIndex: currentValue.activeStepIndex + 1,
                }))
              }
              onAutoPlay={handleStartAutoPlay}
              onPause={() =>
                updateDeterministicUiState((currentValue) => ({
                  ...currentValue,
                  isAutoPlaying: false,
                }))
              }
              onReset={handleResetSimulationProgress}
            />
          )}
        </div>
      </section>
    </main>
  )
}

export default App
