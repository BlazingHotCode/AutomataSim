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
    supported: true,
  },
  {
    id: 'queueAutomaton',
    label: 'Queue Automaton',
    supported: true,
  },
  {
    id: 'turingMachine',
    label: 'Turing Machine',
    supported: true,
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

export const PUSHDOWN_SAMPLE = `states: q0,q1
alphabet: a,b
stackAlphabet: Z,A
stackStart: Z
start: q0
accept: q1
transitions:
q0,a,Z -> q0,A|Z
q0,a,A -> q0,A|A
q0,b,A -> q0,eps
q0,e,Z -> q1,Z`

export const TURING_SAMPLE = `states: q0,q1,qAccept
alphabet: 0,1
tapeAlphabet: 0,1,_
blank: _
start: q0
accept: qAccept
transitions:
q0,0 -> q1,1,R
q0,1 -> q1,0,R
q0,_ -> qAccept,_,S
q1,0 -> q0,0,R
q1,1 -> q0,1,R
q1,_ -> qAccept,_,S`

export const QUEUE_SAMPLE = `states: q0,q1
alphabet: a,b
queueAlphabet: Z,a
queueStart: Z
start: q0
accept: q1
transitions:
q0,a,e -> q0,a
q0,b,a -> q0,e
q0,e,Z -> q1,Z`

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
      definitionText: PUSHDOWN_SAMPLE,
      inputString: '',
      simulationResult: null,
      activeStepIndex: -1,
      isAutoPlaying: false,
    },
    queueAutomaton: {
      definitionText: QUEUE_SAMPLE,
      inputString: '',
      simulationResult: null,
      activeStepIndex: -1,
      isAutoPlaying: false,
    },
    turingMachine: {
      definitionText: TURING_SAMPLE,
      inputString: '',
      simulationResult: null,
      activeStepIndex: -1,
      isAutoPlaying: false,
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
      pushdownInputString?: unknown
      queueInputString?: unknown
      turingInputString?: unknown
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
      pushdownInputString:
        typeof parsed.pushdownInputString === 'string'
          ? parsed.pushdownInputString
          : '',
      queueInputString:
        typeof parsed.queueInputString === 'string'
          ? parsed.queueInputString
          : '',
      turingInputString:
        typeof parsed.turingInputString === 'string'
          ? parsed.turingInputString
          : '',
    }
  } catch {
    return null
  }
}
