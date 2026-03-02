import {
  parseDeterministicFiniteAutomaton,
  parseNondeterministicFiniteAutomaton,
  parsePushdownAutomaton,
  parseQueueAutomaton,
  parseTuringMachine,
} from './parseAutomaton'
import {
  getDefaultUiStateByType,
  getDefinitionsByTypeFromUiState,
  JSON_EXPORT_VERSION,
} from './uiStateHelpers'
import type { AutomatonType, UiStateByType } from '../types/uiState'

export interface ImportValidationResult {
  isValid: boolean
  errors: string[]
}

export function createExportPayload(
  selectedAutomatonType: AutomatonType,
  uiStateByType: UiStateByType,
) {
  return {
    version: JSON_EXPORT_VERSION,
    selectedAutomatonType,
    definitionsByType: getDefinitionsByTypeFromUiState(uiStateByType),
    deterministicInputString:
      uiStateByType.deterministicFiniteAutomaton.inputString,
    nondeterministicInputString:
      uiStateByType.nondeterministicFiniteAutomaton.inputString,
    pushdownInputString: uiStateByType.pushdownAutomaton.inputString,
    queueInputString: uiStateByType.queueAutomaton.inputString,
    turingInputString: uiStateByType.turingMachine.inputString,
  }
}

export function validateImportedPayload(
  payload: unknown,
  validTypes: AutomatonType[],
): ImportValidationResult {
  const errors: string[] = []
  const value =
    typeof payload === 'object' && payload !== null
      ? (payload as {
          version?: unknown
          selectedAutomatonType?: unknown
          definitionsByType?: Partial<Record<AutomatonType, unknown>>
          deterministicInputString?: unknown
          nondeterministicInputString?: unknown
          pushdownInputString?: unknown
          queueInputString?: unknown
          turingInputString?: unknown
        })
      : null

  if (!value) {
    return {
      isValid: false,
      errors: ['Root JSON value must be an object.'],
    }
  }

  if (value.version !== undefined && value.version !== JSON_EXPORT_VERSION) {
    errors.push(`version must be ${JSON_EXPORT_VERSION} when provided.`)
  }

  if (!validTypes.includes(value.selectedAutomatonType as AutomatonType)) {
    errors.push(
      'selectedAutomatonType must be one of the supported automaton type ids.',
    )
  }

  if (
    typeof value.definitionsByType !== 'object' ||
    value.definitionsByType === null
  ) {
    errors.push('definitionsByType must be an object.')
  }

  const definitionsObject =
    value.definitionsByType && typeof value.definitionsByType === 'object'
      ? value.definitionsByType
      : ({} as Partial<Record<AutomatonType, unknown>>)

  const definitionKeys: AutomatonType[] = [
    'deterministicFiniteAutomaton',
    'nondeterministicFiniteAutomaton',
    'pushdownAutomaton',
    'queueAutomaton',
    'turingMachine',
  ]

  definitionKeys.forEach((key) => {
    if (typeof definitionsObject[key] !== 'string') {
      errors.push(`definitionsByType.${key} must be a string.`)
    }
  })

  if (
    value.deterministicInputString !== undefined &&
    typeof value.deterministicInputString !== 'string'
  ) {
    errors.push('deterministicInputString must be a string when provided.')
  }
  if (
    value.nondeterministicInputString !== undefined &&
    typeof value.nondeterministicInputString !== 'string'
  ) {
    errors.push('nondeterministicInputString must be a string when provided.')
  }
  if (
    value.pushdownInputString !== undefined &&
    typeof value.pushdownInputString !== 'string'
  ) {
    errors.push('pushdownInputString must be a string when provided.')
  }
  if (
    value.queueInputString !== undefined &&
    typeof value.queueInputString !== 'string'
  ) {
    errors.push('queueInputString must be a string when provided.')
  }
  if (
    value.turingInputString !== undefined &&
    typeof value.turingInputString !== 'string'
  ) {
    errors.push('turingInputString must be a string when provided.')
  }

  if (typeof definitionsObject.deterministicFiniteAutomaton === 'string') {
    const parseResult = parseDeterministicFiniteAutomaton(
      definitionsObject.deterministicFiniteAutomaton,
    )
    if (!parseResult.value) {
      errors.push('definitionsByType.deterministicFiniteAutomaton is invalid:')
      parseResult.errors
        .slice(0, 5)
        .forEach((error) => errors.push(`- ${error}`))
    }
  }
  if (typeof definitionsObject.nondeterministicFiniteAutomaton === 'string') {
    const parseResult = parseNondeterministicFiniteAutomaton(
      definitionsObject.nondeterministicFiniteAutomaton,
    )
    if (!parseResult.value) {
      errors.push('definitionsByType.nondeterministicFiniteAutomaton is invalid:')
      parseResult.errors.slice(0, 5).forEach((error) => errors.push(`- ${error}`))
    }
  }
  if (typeof definitionsObject.pushdownAutomaton === 'string') {
    const parseResult = parsePushdownAutomaton(
      definitionsObject.pushdownAutomaton,
    )
    if (!parseResult.value) {
      errors.push('definitionsByType.pushdownAutomaton is invalid:')
      parseResult.errors.slice(0, 5).forEach((error) => errors.push(`- ${error}`))
    }
  }
  if (typeof definitionsObject.queueAutomaton === 'string') {
    const parseResult = parseQueueAutomaton(definitionsObject.queueAutomaton)
    if (!parseResult.value) {
      errors.push('definitionsByType.queueAutomaton is invalid:')
      parseResult.errors.slice(0, 5).forEach((error) => errors.push(`- ${error}`))
    }
  }
  if (typeof definitionsObject.turingMachine === 'string') {
    const parseResult = parseTuringMachine(definitionsObject.turingMachine)
    if (!parseResult.value) {
      errors.push('definitionsByType.turingMachine is invalid:')
      parseResult.errors.slice(0, 5).forEach((error) => errors.push(`- ${error}`))
    }
  }

  return { isValid: errors.length === 0, errors }
}

export function buildUiStateFromImportedPayload(payload: {
  selectedAutomatonType: AutomatonType
  definitionsByType: Partial<Record<AutomatonType, unknown>>
  deterministicInputString?: unknown
  nondeterministicInputString?: unknown
  pushdownInputString?: unknown
  queueInputString?: unknown
  turingInputString?: unknown
}): { selectedAutomatonType: AutomatonType; uiStateByType: UiStateByType } {
  const defaults = getDefaultUiStateByType()
  const definitions = payload.definitionsByType

  return {
    selectedAutomatonType: payload.selectedAutomatonType,
    uiStateByType: {
      deterministicFiniteAutomaton: {
        definitionText:
          typeof definitions.deterministicFiniteAutomaton === 'string'
            ? definitions.deterministicFiniteAutomaton
            : defaults.deterministicFiniteAutomaton.definitionText,
        inputString:
          typeof payload.deterministicInputString === 'string'
            ? payload.deterministicInputString
            : '',
        simulationResult: null,
        activeStepIndex: -1,
        isAutoPlaying: false,
      },
      nondeterministicFiniteAutomaton: {
        definitionText:
          typeof definitions.nondeterministicFiniteAutomaton === 'string'
            ? definitions.nondeterministicFiniteAutomaton
            : defaults.nondeterministicFiniteAutomaton.definitionText,
        inputString:
          typeof payload.nondeterministicInputString === 'string'
            ? payload.nondeterministicInputString
            : '',
        simulationResult: null,
        activeStepIndex: -1,
        isAutoPlaying: false,
      },
      pushdownAutomaton: {
        definitionText:
          typeof definitions.pushdownAutomaton === 'string'
            ? definitions.pushdownAutomaton
            : defaults.pushdownAutomaton.definitionText,
        inputString:
          typeof payload.pushdownInputString === 'string'
            ? payload.pushdownInputString
            : '',
        simulationResult: null,
        activeStepIndex: -1,
        isAutoPlaying: false,
      },
      queueAutomaton: {
        definitionText:
          typeof definitions.queueAutomaton === 'string'
            ? definitions.queueAutomaton
            : defaults.queueAutomaton.definitionText,
        inputString:
          typeof payload.queueInputString === 'string'
            ? payload.queueInputString
            : '',
        simulationResult: null,
        activeStepIndex: -1,
        isAutoPlaying: false,
      },
      turingMachine: {
        definitionText:
          typeof definitions.turingMachine === 'string'
            ? definitions.turingMachine
            : defaults.turingMachine.definitionText,
        inputString:
          typeof payload.turingInputString === 'string'
            ? payload.turingInputString
            : '',
        simulationResult: null,
        activeStepIndex: -1,
        isAutoPlaying: false,
      },
    },
  }
}
