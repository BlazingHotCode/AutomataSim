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
import {
  parseDeterministicFiniteAutomaton,
  parseNondeterministicFiniteAutomaton,
} from './lib/parseAutomaton'
import { simulateDFA } from './lib/simulateDFA'
import { simulateNFA } from './lib/simulateNFA'
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
  NondeterministicUiState,
  UiStateByType,
} from './types/uiState'
import type {
  DeterministicSimulationResult,
  NondeterministicFiniteAutomaton,
  NondeterministicSimulationResult,
} from './types/automaton'

function flattenNondeterministicForGraph(
  machine: NondeterministicFiniteAutomaton,
) {
  return {
    states: machine.states,
    alphabet: machine.alphabet,
    startState: machine.startState,
    acceptStates: machine.acceptStates,
    transitions: machine.transitions.flatMap((transition) =>
      transition.to.map((target) => ({
        from: transition.from,
        symbol: transition.symbol,
        to: target,
      })),
    ),
  }
}

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
      inputString: persistedUiConfig?.nondeterministicInputString ?? '',
      simulationResult: null,
      activeStepIndex: -1,
      isAutoPlaying: false,
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
    uiStateByType.deterministicFiniteAutomaton
  const nondeterministicUiState =
    uiStateByType.nondeterministicFiniteAutomaton
  const activeSimulationUiState =
    selectedAutomatonType === 'deterministicFiniteAutomaton'
      ? deterministicUiState
      : selectedAutomatonType === 'nondeterministicFiniteAutomaton'
        ? nondeterministicUiState
        : null
  const inputString = activeSimulationUiState?.inputString ?? ''
  const simulationResult = activeSimulationUiState?.simulationResult ?? null
  const activeStepIndex = activeSimulationUiState?.activeStepIndex ?? -1
  const isAutoPlaying = activeSimulationUiState?.isAutoPlaying ?? false

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

  function updateNondeterministicUiState(
    updater: (
      currentValue: NondeterministicUiState,
    ) => NondeterministicUiState,
  ) {
    setUiStateByType((currentValue) => ({
      ...currentValue,
      nondeterministicFiniteAutomaton: updater(
        currentValue.nondeterministicFiniteAutomaton,
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

  const deterministicParseResult = useMemo(() => {
    if (selectedAutomatonType !== 'deterministicFiniteAutomaton') {
      return null
    }
    return parseDeterministicFiniteAutomaton(definitionText)
  }, [definitionText, selectedAutomatonType])
  const nondeterministicParseResult = useMemo(() => {
    if (selectedAutomatonType !== 'nondeterministicFiniteAutomaton') {
      return null
    }
    return parseNondeterministicFiniteAutomaton(definitionText)
  }, [definitionText, selectedAutomatonType])
  const activeParseErrors =
    selectedAutomatonType === 'deterministicFiniteAutomaton'
      ? (deterministicParseResult?.errors ?? [])
      : selectedAutomatonType === 'nondeterministicFiniteAutomaton'
        ? (nondeterministicParseResult?.errors ?? [])
        : []
  const graphMachine = (() => {
    if (
      selectedAutomatonType === 'deterministicFiniteAutomaton' &&
      deterministicParseResult?.value
    ) {
      return deterministicParseResult.value
    }
    if (
      selectedAutomatonType === 'nondeterministicFiniteAutomaton' &&
      nondeterministicParseResult?.value
    ) {
      return flattenNondeterministicForGraph(nondeterministicParseResult.value)
    }
    return null
  })()

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
              simulationResult: null,
              activeStepIndex: -1,
              isAutoPlaying: false,
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
    if (selectedAutomatonType === 'deterministicFiniteAutomaton') {
      if (!deterministicParseResult?.value) {
        updateDeterministicUiState((currentValue) => ({
          ...currentValue,
          simulationResult: null,
          activeStepIndex: -1,
          isAutoPlaying: false,
        }))
        return
      }

      const nextResult = simulateDFA(deterministicParseResult.value, inputString)
      updateDeterministicUiState((currentValue) => ({
        ...currentValue,
        simulationResult: nextResult,
        activeStepIndex: nextResult.trace.length - 1,
        isAutoPlaying: false,
      }))
      return
    }

    if (selectedAutomatonType !== 'nondeterministicFiniteAutomaton') {
      return
    }

    if (!nondeterministicParseResult?.value) {
      updateNondeterministicUiState((currentValue) => ({
        ...currentValue,
        simulationResult: null,
        activeStepIndex: -1,
        isAutoPlaying: false,
      }))
      return
    }

    const nextResult = simulateNFA(nondeterministicParseResult.value, inputString)
    updateNondeterministicUiState((currentValue) => ({
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
  const isDeterministicResult = (
    value: DeterministicSimulationResult | NondeterministicSimulationResult,
  ): value is DeterministicSimulationResult => 'finalState' in value
  const activeStates = (() => {
    if (!simulationResult) {
      return new Set<string>()
    }
    if (isDeterministicResult(simulationResult)) {
      const state =
        activeStepIndex >= 0
          ? simulationResult.trace[activeStepIndex].toState
          : simulationResult.startState
      return new Set([state])
    }
    const states =
      activeStepIndex >= 0
        ? simulationResult.trace[activeStepIndex].toStates
        : simulationResult.startStates
    return new Set(states)
  })()
  const activeStateLabel =
    activeStates.size === 0 ? null : Array.from(activeStates).join(', ')
  const traversedTransitionKeys = (() => {
    if (!simulationResult || !isDeterministicResult(simulationResult)) {
      return new Set<string>()
    }
    const traversedSteps =
      activeStepIndex < 0
        ? []
        : simulationResult.trace.slice(0, activeStepIndex + 1)
    return new Set(
      traversedSteps.map(
        (step) => `${step.fromState}|${step.symbol}|${step.toState}`,
      ),
    )
  })()
  const traversedStates = (() => {
    if (!simulationResult) {
      return new Set<string>()
    }
    if (isDeterministicResult(simulationResult)) {
      const traversedSteps =
        activeStepIndex < 0
          ? []
          : simulationResult.trace.slice(0, activeStepIndex + 1)
      return new Set([
        simulationResult.startState,
        ...traversedSteps.map((step) => step.toState),
      ])
    }
    const traversedSteps =
      activeStepIndex < 0
        ? []
        : simulationResult.trace.slice(0, activeStepIndex + 1)
    return new Set([
      ...simulationResult.startStates,
      ...traversedSteps.flatMap((step) => step.toStates),
    ])
  })()
  const activeTransitionKey = (() => {
    if (
      !simulationResult ||
      !isDeterministicResult(simulationResult) ||
      activeStepIndex < 0
    ) {
      return null
    }
    const step = simulationResult.trace[activeStepIndex]
    return `${step.fromState}|${step.symbol}|${step.toState}`
  })()

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
      if (selectedAutomatonType === 'deterministicFiniteAutomaton') {
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
        return
      }
      if (selectedAutomatonType === 'nondeterministicFiniteAutomaton') {
        updateNondeterministicUiState((currentValue) => {
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
      }
    }, 700)

    return () => window.clearTimeout(timer)
  }, [activeStepIndex, isAutoPlaying, selectedAutomatonType, simulationResult])

  useEffect(() => {
    if (typeof window === 'undefined') {
      return
    }

    const payload = {
      selectedAutomatonType,
      definitionsByType: getDefinitionsByTypeFromUiState(uiStateByType),
      deterministicInputString:
        uiStateByType.deterministicFiniteAutomaton.inputString,
      nondeterministicInputString:
        uiStateByType.nondeterministicFiniteAutomaton.inputString,
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
        nondeterministicInputString?: unknown
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
      if (selectedAutomatonType === 'deterministicFiniteAutomaton') {
        updateDeterministicUiState((currentValue) => ({
          ...currentValue,
          activeStepIndex: -1,
          isAutoPlaying: true,
        }))
      }
      if (selectedAutomatonType === 'nondeterministicFiniteAutomaton') {
        updateNondeterministicUiState((currentValue) => ({
          ...currentValue,
          activeStepIndex: -1,
          isAutoPlaying: true,
        }))
      }
      return
    }
    if (selectedAutomatonType === 'deterministicFiniteAutomaton') {
      updateDeterministicUiState((currentValue) => ({
        ...currentValue,
        isAutoPlaying: true,
      }))
    }
    if (selectedAutomatonType === 'nondeterministicFiniteAutomaton') {
      updateNondeterministicUiState((currentValue) => ({
        ...currentValue,
        isAutoPlaying: true,
      }))
    }
  }

  function handleResetSimulationProgress() {
    if (selectedAutomatonType === 'deterministicFiniteAutomaton') {
      updateDeterministicUiState((currentValue) => ({
        ...currentValue,
        isAutoPlaying: false,
        activeStepIndex: -1,
      }))
    }
    if (selectedAutomatonType === 'nondeterministicFiniteAutomaton') {
      updateNondeterministicUiState((currentValue) => ({
        ...currentValue,
        isAutoPlaying: false,
        activeStepIndex: -1,
      }))
    }
  }

  function handleClearSimulation() {
    if (selectedAutomatonType === 'deterministicFiniteAutomaton') {
      updateDeterministicUiState((currentValue) => ({
        ...currentValue,
        isAutoPlaying: false,
        activeStepIndex: -1,
        simulationResult: null,
        inputString: '',
      }))
    }
    if (selectedAutomatonType === 'nondeterministicFiniteAutomaton') {
      updateNondeterministicUiState((currentValue) => ({
        ...currentValue,
        isAutoPlaying: false,
        activeStepIndex: -1,
        simulationResult: null,
        inputString: '',
      }))
    }
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
            {selectedAutomatonType === 'deterministicFiniteAutomaton'
              ? 'Format: `states`, `alphabet`, `start`, `accept`, then `transitions`. Transition syntax: `source,symbol -> target`'
              : selectedAutomatonType === 'nondeterministicFiniteAutomaton'
                ? 'Format: `states`, `alphabet`, `start`, `accept`, then `transitions`. Transition syntax: `source,symbol -> targetA|targetB` (epsilon accepted as `e`, `eps`, `epsilon`, or `ε`).'
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

          {(selectedAutomatonType === 'deterministicFiniteAutomaton' ||
            selectedAutomatonType === 'nondeterministicFiniteAutomaton') && (
            <SimulationControls
              inputString={inputString}
              onInputChange={(value) => {
                if (selectedAutomatonType === 'deterministicFiniteAutomaton') {
                  updateDeterministicUiState((currentValue) => ({
                    ...currentValue,
                    inputString: value,
                    simulationResult: null,
                    activeStepIndex: -1,
                    isAutoPlaying: false,
                  }))
                }
                if (
                  selectedAutomatonType === 'nondeterministicFiniteAutomaton'
                ) {
                  updateNondeterministicUiState((currentValue) => ({
                    ...currentValue,
                    inputString: value,
                    simulationResult: null,
                    activeStepIndex: -1,
                    isAutoPlaying: false,
                  }))
                }
              }}
              onRun={handleRunSimulation}
              canRun={Boolean(
                selectedAutomatonType === 'deterministicFiniteAutomaton'
                  ? deterministicParseResult?.value
                  : nondeterministicParseResult?.value,
              )}
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
              parseErrors={activeParseErrors}
            />
          )}
        </div>

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
              activeStateLabel={activeStateLabel}
              canStepBackward={canStepBackward}
              canStepForward={canStepForward}
              canAutoPlay={canAutoPlay}
              isAutoPlaying={isAutoPlaying}
              onPrevious={() => {
                if (selectedAutomatonType === 'deterministicFiniteAutomaton') {
                  updateDeterministicUiState((currentValue) => ({
                    ...currentValue,
                    activeStepIndex: currentValue.activeStepIndex - 1,
                  }))
                }
                if (
                  selectedAutomatonType === 'nondeterministicFiniteAutomaton'
                ) {
                  updateNondeterministicUiState((currentValue) => ({
                    ...currentValue,
                    activeStepIndex: currentValue.activeStepIndex - 1,
                  }))
                }
              }}
              onNext={() => {
                if (selectedAutomatonType === 'deterministicFiniteAutomaton') {
                  updateDeterministicUiState((currentValue) => ({
                    ...currentValue,
                    activeStepIndex: currentValue.activeStepIndex + 1,
                  }))
                }
                if (
                  selectedAutomatonType === 'nondeterministicFiniteAutomaton'
                ) {
                  updateNondeterministicUiState((currentValue) => ({
                    ...currentValue,
                    activeStepIndex: currentValue.activeStepIndex + 1,
                  }))
                }
              }}
              onAutoPlay={handleStartAutoPlay}
              onPause={() => {
                if (selectedAutomatonType === 'deterministicFiniteAutomaton') {
                  updateDeterministicUiState((currentValue) => ({
                    ...currentValue,
                    isAutoPlaying: false,
                  }))
                }
                if (
                  selectedAutomatonType === 'nondeterministicFiniteAutomaton'
                ) {
                  updateNondeterministicUiState((currentValue) => ({
                    ...currentValue,
                    isAutoPlaying: false,
                  }))
                }
              }}
              onReset={handleResetSimulationProgress}
            />
          )}
        </div>
      </section>
    </main>
  )
}

export default App
