import type {
  AutomatonOption,
  AutomatonType,
  PersistedUiConfig,
  UiStateByType,
} from '../types/uiState'

export const AUTOMATON_OPTIONS: AutomatonOption[] = [
  {
    id: 'deterministicFiniteAutomaton',
    label: 'Deterministic Finite Automaton',
    supported: true,
  },
  {
    id: 'nondeterministicFiniteAutomaton',
    label: 'Nondeterministic Finite Automaton',
    supported: true,
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

export const DETERMINISTIC_SAMPLE = `states: q0,q1,q2
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

export const FUTURE_TEMPLATE = `# Format for this automaton type will be added here.
# This mode is planned but not implemented yet.`

export const NONDETERMINISTIC_SAMPLE = `states: q0,q1,q2
alphabet: 0,1
start: q0
accept: q2
transitions:
q0,eps -> q1
q0,0 -> q0
q0,1 -> q0
q1,0 -> q2
q1,1 -> q2
q2,0 -> q2
q2,1 -> q2`

export const LOCAL_STORAGE_KEY = 'automatasim:ui-state:v1'
export const JSON_EXPORT_VERSION = 1

export function getDefaultUiStateByType(): UiStateByType {
  return {
    deterministicFiniteAutomaton: {
      definitionText: DETERMINISTIC_SAMPLE,
      inputString: '',
      simulationResult: null,
      activeStepIndex: -1,
      isAutoPlaying: false,
    },
    nondeterministicFiniteAutomaton: {
      definitionText: NONDETERMINISTIC_SAMPLE,
      inputString: '',
      simulationResult: null,
      activeStepIndex: -1,
      isAutoPlaying: false,
    },
    pushdownAutomaton: {
      definitionText: FUTURE_TEMPLATE,
    },
    queueAutomaton: {
      definitionText: FUTURE_TEMPLATE,
    },
    turingMachine: {
      definitionText: FUTURE_TEMPLATE,
    },
  }
}

export function getDefinitionsByTypeFromUiState(value: UiStateByType) {
  return {
    deterministicFiniteAutomaton:
      value.deterministicFiniteAutomaton.definitionText,
    nondeterministicFiniteAutomaton:
      value.nondeterministicFiniteAutomaton.definitionText,
    pushdownAutomaton: value.pushdownAutomaton.definitionText,
    queueAutomaton: value.queueAutomaton.definitionText,
    turingMachine: value.turingMachine.definitionText,
  }
}

export function loadPersistedUiConfig(): PersistedUiConfig | null {
  if (typeof window === 'undefined') {
    return null
  }

  try {
    const rawValue = window.localStorage.getItem(LOCAL_STORAGE_KEY)
    if (!rawValue) {
      return null
    }

    const parsed = JSON.parse(rawValue) as {
      selectedAutomatonType?: unknown
      definitionsByType?: Partial<Record<AutomatonType, unknown>>
      deterministicInputString?: unknown
      nondeterministicInputString?: unknown
    }
    const maybeType = parsed.selectedAutomatonType
    const validType = AUTOMATON_OPTIONS.some(
      (option) => option.id === maybeType,
    )
    if (!validType) {
      return null
    }

    const fallbackDefinitions = getDefaultUiStateByType()
    const persistedDefinitions = parsed.definitionsByType ?? {}

    return {
      selectedAutomatonType: maybeType as AutomatonType,
      definitionsByType: {
        deterministicFiniteAutomaton:
          typeof persistedDefinitions.deterministicFiniteAutomaton === 'string'
            ? persistedDefinitions.deterministicFiniteAutomaton
            : fallbackDefinitions.deterministicFiniteAutomaton.definitionText,
        nondeterministicFiniteAutomaton:
          typeof persistedDefinitions.nondeterministicFiniteAutomaton ===
          'string'
            ? persistedDefinitions.nondeterministicFiniteAutomaton
            : fallbackDefinitions.nondeterministicFiniteAutomaton
                .definitionText,
        pushdownAutomaton:
          typeof persistedDefinitions.pushdownAutomaton === 'string'
            ? persistedDefinitions.pushdownAutomaton
            : fallbackDefinitions.pushdownAutomaton.definitionText,
        queueAutomaton:
          typeof persistedDefinitions.queueAutomaton === 'string'
            ? persistedDefinitions.queueAutomaton
            : fallbackDefinitions.queueAutomaton.definitionText,
        turingMachine:
          typeof persistedDefinitions.turingMachine === 'string'
            ? persistedDefinitions.turingMachine
            : fallbackDefinitions.turingMachine.definitionText,
      },
      deterministicInputString:
        typeof parsed.deterministicInputString === 'string'
          ? parsed.deterministicInputString
          : '',
      nondeterministicInputString:
        typeof parsed.nondeterministicInputString === 'string'
          ? parsed.nondeterministicInputString
          : '',
    }
  } catch {
    return null
  }
}
