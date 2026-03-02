import { parseDeterministicFiniteAutomaton } from './parseAutomaton'
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

  return { isValid: errors.length === 0, errors }
}

export function buildUiStateFromImportedPayload(payload: {
  selectedAutomatonType: AutomatonType
  definitionsByType: Partial<Record<AutomatonType, unknown>>
  deterministicInputString?: unknown
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
      },
      pushdownAutomaton: {
        definitionText:
          typeof definitions.pushdownAutomaton === 'string'
            ? definitions.pushdownAutomaton
            : defaults.pushdownAutomaton.definitionText,
      },
      queueAutomaton: {
        definitionText:
          typeof definitions.queueAutomaton === 'string'
            ? definitions.queueAutomaton
            : defaults.queueAutomaton.definitionText,
      },
      turingMachine: {
        definitionText:
          typeof definitions.turingMachine === 'string'
            ? definitions.turingMachine
            : defaults.turingMachine.definitionText,
      },
    },
  }
}
