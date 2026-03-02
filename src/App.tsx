import { useEffect, useMemo, useState } from 'react'
import './App.css'
import { parseDeterministicFiniteAutomaton } from './lib/parseAutomaton'
import { simulateDFA } from './lib/simulateDFA'
import type {
  DeterministicFiniteAutomaton,
  DeterministicSimulationResult,
} from './types/automaton'

type AutomatonType =
  | 'deterministicFiniteAutomaton'
  | 'nondeterministicFiniteAutomaton'
  | 'pushdownAutomaton'
  | 'queueAutomaton'
  | 'turingMachine'

interface AutomatonOption {
  id: AutomatonType
  label: string
  supported: boolean
}

const AUTOMATON_OPTIONS: AutomatonOption[] = [
  {
    id: 'deterministicFiniteAutomaton',
    label: 'Deterministic Finite Automaton',
    supported: true,
  },
  {
    id: 'nondeterministicFiniteAutomaton',
    label: 'Nondeterministic Finite Automaton',
    supported: false,
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

const DETERMINISTIC_SAMPLE = `states: q0,q1,q2
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

const FUTURE_TEMPLATE = `# Format for this automaton type will be added here.
# This mode is planned but not implemented yet.`

interface DeterministicUiState {
  definitionText: string
  inputString: string
  simulationResult: DeterministicSimulationResult | null
  activeStepIndex: number
  isAutoPlaying: boolean
}

interface PlannedUiState {
  definitionText: string
}

type UiStateByType = {
  deterministicFiniteAutomaton: DeterministicUiState
  nondeterministicFiniteAutomaton: PlannedUiState
  pushdownAutomaton: PlannedUiState
  queueAutomaton: PlannedUiState
  turingMachine: PlannedUiState
}

const LOCAL_STORAGE_KEY = 'automatasim:ui-state:v1'

function getConnectionAwareStatePositions(
  machine: DeterministicFiniteAutomaton,
) {
  const width = 720
  const height = 360
  const marginX = 80
  const marginY = 56
  const availableWidth = width - marginX * 2
  const availableHeight = height - marginY * 2

  if (machine.states.length === 0) {
    return {}
  }

  const adjacency = new Map<string, string[]>()
  machine.states.forEach((state) => adjacency.set(state, []))
  machine.transitions.forEach((transition) => {
    adjacency.get(transition.from)?.push(transition.to)
  })

  // Layer by shortest distance from start state so directional flow is left->right.
  const distances = new Map<string, number>()
  const queue: string[] = [machine.startState]
  distances.set(machine.startState, 0)

  while (queue.length > 0) {
    const current = queue.shift()!
    const currentDistance = distances.get(current) ?? 0
    const neighbors = adjacency.get(current) ?? []
    neighbors.forEach((neighbor) => {
      if (!distances.has(neighbor)) {
        distances.set(neighbor, currentDistance + 1)
        queue.push(neighbor)
      }
    })
  }

  // Put unreachable states after the furthest reachable layer.
  const maxReachableDistance = Math.max(
    0,
    ...Array.from(distances.values()),
  )
  let unreachableOffset = 1
  machine.states.forEach((state) => {
    if (!distances.has(state)) {
      distances.set(state, maxReachableDistance + unreachableOffset)
      unreachableOffset += 1
    }
  })

  const layers = new Map<number, string[]>()
  machine.states.forEach((state) => {
    const level = distances.get(state) ?? 0
    if (!layers.has(level)) {
      layers.set(level, [])
    }
    layers.get(level)!.push(state)
  })

  const layerIndices = Array.from(layers.keys()).sort((a, b) => a - b)
  const layerCount = layerIndices.length
  const positions: Record<string, { x: number; y: number }> = {}

  layerIndices.forEach((layer, layerIndex) => {
    const layerStates = layers.get(layer) ?? []
    layerStates.sort()
    const xRatio = layerCount <= 1 ? 0.5 : layerIndex / (layerCount - 1)
    const x = marginX + xRatio * availableWidth
    const count = layerStates.length

    layerStates.forEach((state, stateIndex) => {
      const yRatio = count <= 1 ? 0.5 : stateIndex / (count - 1)
      positions[state] = {
        x,
        y: marginY + yRatio * availableHeight,
      }
    })
  })

  return positions
}

interface AutomatonGraphProps {
  machine: DeterministicFiniteAutomaton
  currentState?: string | null
  traversedStates?: Set<string>
  traversedTransitionKeys?: Set<string>
  activeTransitionKey?: string | null
}

function AutomatonGraph({
  machine,
  currentState = null,
  traversedStates = new Set<string>(),
  traversedTransitionKeys = new Set<string>(),
  activeTransitionKey = null,
}: AutomatonGraphProps) {
  const positions = getConnectionAwareStatePositions(machine)
  const nodeRadius = 28
  const transitionGroupsMap = new Map<
    string,
    DeterministicFiniteAutomaton['transitions']
  >()
  machine.transitions.forEach((transition) => {
    const groupKey = `${transition.from}|${transition.to}`
    const existing = transitionGroupsMap.get(groupKey)
    if (existing) {
      existing.push(transition)
      return
    }
    transitionGroupsMap.set(groupKey, [transition])
  })
  const transitionGroups = Array.from(transitionGroupsMap.entries()).map(
    ([groupKey, transitions]) => {
      const [from, to] = groupKey.split('|')
      return { groupKey, from, to, transitions }
    },
  )

  interface Point {
    x: number
    y: number
  }

  interface RoutedEdgePlacement {
    curveOffset: number
    labelOffset: number
  }

  interface SelfLoopPlacement {
    startX: number
    startY: number
    control1X: number
    control1Y: number
    control2X: number
    control2Y: number
    endX: number
    endY: number
    labelX: number
    labelY: number
    controlPoint: Point
    labelPoint: Point
  }

  interface EdgeGeometry {
    length: number
    unitX: number
    unitY: number
    startX: number
    startY: number
    endX: number
    endY: number
  }

  const allStateEntries = machine.states.map((state) => ({
    state,
    point: positions[state],
  }))

  function getEdgeGeometry(fromState: string, toState: string): EdgeGeometry {
    const from = positions[fromState]
    const to = positions[toState]
    const dx = to.x - from.x
    const dy = to.y - from.y
    const length = Math.hypot(dx, dy)
    const unitX = dx / length
    const unitY = dy / length
    return {
      length,
      unitX,
      unitY,
      startX: from.x + unitX * nodeRadius,
      startY: from.y + unitY * nodeRadius,
      endX: to.x - unitX * nodeRadius,
      endY: to.y - unitY * nodeRadius,
    }
  }

  function pointDistance(a: Point, b: Point) {
    return Math.hypot(a.x - b.x, a.y - b.y)
  }

  function minDistanceToPoints(point: Point, points: Point[]) {
    if (points.length === 0) {
      return 999
    }
    return Math.min(...points.map((otherPoint) => pointDistance(point, otherPoint)))
  }

  function minDistanceToNodeEdges(
    point: Point,
    excludedStates: Set<string>,
    extraPadding = 0,
  ) {
    const candidateNodeCenters = allStateEntries
      .filter((entry) => !excludedStates.has(entry.state))
      .map((entry) => entry.point)
    if (candidateNodeCenters.length === 0) {
      return 999
    }
    return (
      Math.min(
        ...candidateNodeCenters.map((center) => pointDistance(point, center)),
      ) -
      (nodeRadius + extraPadding)
    )
  }

  function quadraticPointAt(
    t: number,
    start: Point,
    control: Point,
    end: Point,
  ): Point {
    const oneMinusT = 1 - t
    return {
      x:
        oneMinusT * oneMinusT * start.x +
        2 * oneMinusT * t * control.x +
        t * t * end.x,
      y:
        oneMinusT * oneMinusT * start.y +
        2 * oneMinusT * t * control.y +
        t * t * end.y,
    }
  }

  function cubicPointAt(
    t: number,
    start: Point,
    control1: Point,
    control2: Point,
    end: Point,
  ): Point {
    const oneMinusT = 1 - t
    return {
      x:
        oneMinusT * oneMinusT * oneMinusT * start.x +
        3 * oneMinusT * oneMinusT * t * control1.x +
        3 * oneMinusT * t * t * control2.x +
        t * t * t * end.x,
      y:
        oneMinusT * oneMinusT * oneMinusT * start.y +
        3 * oneMinusT * oneMinusT * t * control1.y +
        3 * oneMinusT * t * t * control2.y +
        t * t * t * end.y,
    }
  }

  const routedPlacementByGroupKey = new Map<string, RoutedEdgePlacement>()
  const selfLoopPlacementByGroupKey = new Map<string, SelfLoopPlacement>()
  const chosenControlPoints: Point[] = []
  const chosenLabelPoints: Point[] = []

  const selfLoopGroups = transitionGroups.filter((group) => group.from === group.to)
  const nonSelfGroups = transitionGroups.filter((group) => group.from !== group.to)

  const selfLoopDirectionCandidates = [
    -Math.PI / 2, // top only
  ]

  function getSelfLoopCandidatePlacement(
    group: { from: string; to: string; groupKey: string; transitions: DeterministicFiniteAutomaton['transitions'] },
    directionAngle: number,
  ): { placement: SelfLoopPlacement; score: number } {
    const center = positions[group.from]
    const radialX = Math.cos(directionAngle)
    const radialY = Math.sin(directionAngle)
    const tangentX = -Math.sin(directionAngle)
    const tangentY = Math.cos(directionAngle)
    const spread = 12
    const bulge = nodeRadius + 46
    const labelDistance = nodeRadius + 62 + Math.max(0, group.transitions.length - 1) * 6

    const start = {
      x: center.x + radialX * nodeRadius - tangentX * spread,
      y: center.y + radialY * nodeRadius - tangentY * spread,
    }
    const end = {
      x: center.x + radialX * nodeRadius + tangentX * spread,
      y: center.y + radialY * nodeRadius + tangentY * spread,
    }
    const control1 = {
      x: center.x + radialX * bulge - tangentX * 32,
      y: center.y + radialY * bulge - tangentY * 32,
    }
    const control2 = {
      x: center.x + radialX * bulge + tangentX * 32,
      y: center.y + radialY * bulge + tangentY * 32,
    }
    const labelPoint = {
      x: center.x + radialX * labelDistance,
      y: center.y + radialY * labelDistance,
    }

    const sampledCurvePoints = [0.15, 0.3, 0.45, 0.6, 0.75, 0.9].map((t) =>
      cubicPointAt(t, start, control1, control2, end),
    )
    const minCurveClearanceToNodeEdge = Math.min(
      ...sampledCurvePoints.map((point) =>
        minDistanceToNodeEdges(point, new Set([group.from])),
      ),
    )
    const labelClearanceToNodeEdge = minDistanceToNodeEdges(
      labelPoint,
      new Set([group.from]),
      8,
    )
    const routeClearance =
      minDistanceToPoints(control1, chosenControlPoints) +
      minDistanceToPoints(control2, chosenControlPoints) +
      minDistanceToPoints(labelPoint, chosenLabelPoints)
    const score = minCurveClearanceToNodeEdge * 2.2 + labelClearanceToNodeEdge + routeClearance * 1.1

    return {
      placement: {
        startX: start.x,
        startY: start.y,
        control1X: control1.x,
        control1Y: control1.y,
        control2X: control2.x,
        control2Y: control2.y,
        endX: end.x,
        endY: end.y,
        labelX: labelPoint.x,
        labelY: labelPoint.y,
        controlPoint: {
          x: (control1.x + control2.x) / 2,
          y: (control1.y + control2.y) / 2,
        },
        labelPoint,
      },
      score,
    }
  }

  selfLoopGroups.forEach((group) => {
    let best = getSelfLoopCandidatePlacement(group, selfLoopDirectionCandidates[0])
    selfLoopDirectionCandidates.slice(1).forEach((directionAngle) => {
      const candidate = getSelfLoopCandidatePlacement(group, directionAngle)
      if (candidate.score > best.score) {
        best = candidate
      }
    })
    selfLoopPlacementByGroupKey.set(group.groupKey, best.placement)
    chosenControlPoints.push(best.placement.controlPoint)
    chosenLabelPoints.push(best.placement.labelPoint)
  })
  function getCandidatePlacement(
    group: { from: string; to: string; groupKey: string },
    sign: number,
    hasReverseDirection: boolean,
  ) {
    const geometry = getEdgeGeometry(group.from, group.to)
    const baseCurveMagnitude = Math.max(20, Math.min(34, geometry.length * 0.13))
    const pairExtraMagnitude = hasReverseDirection
      ? Math.max(34, Math.min(58, geometry.length * 0.24))
      : 0
    const normalX = -geometry.unitY
    const normalY = geometry.unitX
    const excludedStates = new Set([group.from, group.to])

    function evaluateAtCurveMagnitude(curveMagnitude: number) {
      const curveOffset = sign * curveMagnitude
      const controlPoint = {
        x: (geometry.startX + geometry.endX) / 2 + normalX * curveOffset,
        y: (geometry.startY + geometry.endY) / 2 + normalY * curveOffset,
      }
      const labelOffset = sign * Math.max(16, Math.min(30, curveMagnitude * 0.35))
      const labelPoint = {
        x:
          0.25 * geometry.startX +
          0.5 * controlPoint.x +
          0.25 * geometry.endX +
          normalX * labelOffset,
        y:
          0.25 * geometry.startY +
          0.5 * controlPoint.y +
          0.25 * geometry.endY +
          normalY * labelOffset,
      }

      const curvePoints = [0.2, 0.35, 0.5, 0.65, 0.8].map((t) =>
        quadraticPointAt(
          t,
          { x: geometry.startX, y: geometry.startY },
          controlPoint,
          { x: geometry.endX, y: geometry.endY },
        ),
      )
      const minCurveClearanceToNodeEdge = Math.min(
        ...curvePoints.map((point) => minDistanceToNodeEdges(point, excludedStates)),
      )
      const labelClearanceToNodeEdge = minDistanceToNodeEdges(
        labelPoint,
        excludedStates,
        8,
      )

      const stateClearance =
        minCurveClearanceToNodeEdge * 2.1 + labelClearanceToNodeEdge
      const routeClearance =
        minDistanceToPoints(controlPoint, chosenControlPoints) +
        minDistanceToPoints(labelPoint, chosenLabelPoints)
      const sizePenalty = curveMagnitude * 0.15
      const totalScore = stateClearance + routeClearance * 1.2 - sizePenalty

      return {
        curveOffset,
        labelOffset,
        controlPoint,
        labelPoint,
        minCurveClearanceToNodeEdge,
        labelClearanceToNodeEdge,
        score: totalScore,
      }
    }

    let curveMagnitude = baseCurveMagnitude + pairExtraMagnitude
    let bestCandidate = evaluateAtCurveMagnitude(curveMagnitude)

    // Increase bend until path and label clear node circles adequately,
    // while still tracking the best-scoring candidate.
    for (let attempt = 0; attempt < 6; attempt += 1) {
      const candidate = evaluateAtCurveMagnitude(curveMagnitude)
      if (candidate.score > bestCandidate.score) {
        bestCandidate = candidate
      }
      if (
        candidate.minCurveClearanceToNodeEdge >= 8 &&
        candidate.labelClearanceToNodeEdge >= 10
      ) {
        bestCandidate = candidate
        break
      }
      curveMagnitude += 14
    }

    return {
      curveOffset: bestCandidate.curveOffset,
      labelOffset: bestCandidate.labelOffset,
      controlPoint: bestCandidate.controlPoint,
      labelPoint: bestCandidate.labelPoint,
      score: bestCandidate.score,
    }
  }

  // Route bidirectional pairs together and single edges greedily.
  const pairedByUnorderedKey = new Map<
    string,
    Array<{ from: string; to: string; groupKey: string }>
  >()
  nonSelfGroups.forEach((group) => {
    const unorderedKey = [group.from, group.to].sort().join('|')
    const existing = pairedByUnorderedKey.get(unorderedKey)
    if (existing) {
      existing.push(group)
      return
    }
    pairedByUnorderedKey.set(unorderedKey, [group])
  })

  const sortedPairBuckets = Array.from(pairedByUnorderedKey.values()).sort(
    (a, b) => {
      const aGeometry = getEdgeGeometry(a[0].from, a[0].to)
      const bGeometry = getEdgeGeometry(b[0].from, b[0].to)
      return bGeometry.length - aGeometry.length
    },
  )

  sortedPairBuckets.forEach((bucket) => {
    if (bucket.length === 2) {
      const [first, second] = bucket
      const firstPositive = getCandidatePlacement(first, 1, true)
      const secondNegative = getCandidatePlacement(second, -1, true)
      const scoreOptionA = firstPositive.score + secondNegative.score

      const firstNegative = getCandidatePlacement(first, -1, true)
      const secondPositive = getCandidatePlacement(second, 1, true)
      const scoreOptionB = firstNegative.score + secondPositive.score

      const chosen =
        scoreOptionA >= scoreOptionB
          ? [
              { group: first, placement: firstPositive },
              { group: second, placement: secondNegative },
            ]
          : [
              { group: first, placement: firstNegative },
              { group: second, placement: secondPositive },
            ]

      chosen.forEach(({ group, placement }) => {
        routedPlacementByGroupKey.set(group.groupKey, {
          curveOffset: placement.curveOffset,
          labelOffset: placement.labelOffset,
        })
        chosenControlPoints.push(placement.controlPoint)
        chosenLabelPoints.push(placement.labelPoint)
      })
      return
    }

    const [single] = bucket
    const candidatePositive = getCandidatePlacement(single, 1, false)
    const candidateNegative = getCandidatePlacement(single, -1, false)
    const chosen =
      candidatePositive.score >= candidateNegative.score
        ? candidatePositive
        : candidateNegative
    routedPlacementByGroupKey.set(single.groupKey, {
      curveOffset: chosen.curveOffset,
      labelOffset: chosen.labelOffset,
    })
    chosenControlPoints.push(chosen.controlPoint)
    chosenLabelPoints.push(chosen.labelPoint)
  })

  return (
    <svg viewBox="0 0 720 360" className="automaton-canvas" role="img">
      <defs>
        <marker
          id="arrow"
          markerWidth="8"
          markerHeight="8"
          refX="7"
          refY="4"
          orient="auto"
        >
          <path d="M0,0 L8,4 L0,8 Z" fill="context-stroke" />
        </marker>
      </defs>

      {transitionGroups.map((group) => {
        const from = positions[group.from]
        const to = positions[group.to]
        const isSelfLoop = group.from === group.to
        const transitionKeys = group.transitions.map(
          (transition) =>
            `${transition.from}|${transition.symbol}|${transition.to}`,
        )
        const isTraversed = transitionKeys.some((key) =>
          traversedTransitionKeys.has(key),
        )
        const isActive = transitionKeys.some((key) => key === activeTransitionKey)
        const strokeColor = isActive ? '#d36b1f' : isTraversed ? '#2f7f4f' : '#2e4c76'
        const textColor = isActive ? '#8d3f08' : isTraversed ? '#1d5b34' : '#10284a'
        const strokeWidth = isActive ? 3 : 2

        if (isSelfLoop) {
          const placement = selfLoopPlacementByGroupKey.get(group.groupKey)
          if (!placement) {
            return null
          }

          return (
            <g key={group.groupKey}>
              <path
                d={`M ${placement.startX} ${placement.startY}
                    C ${placement.control1X} ${placement.control1Y},
                      ${placement.control2X} ${placement.control2Y},
                      ${placement.endX} ${placement.endY}`}
                fill="none"
                stroke={strokeColor}
                strokeWidth={strokeWidth}
                markerEnd="url(#arrow)"
              />
              <text
                x={placement.labelX}
                y={placement.labelY}
                textAnchor="middle"
                fill={textColor}
                stroke="#fbfdff"
                strokeWidth={4}
                paintOrder="stroke"
              >
                {group.transitions.map((transition, index) => (
                  <tspan
                    key={transition.symbol}
                    x={placement.labelX}
                    dy={index === 0 ? 0 : 14}
                  >
                    {transition.symbol}
                  </tspan>
                ))}
              </text>
            </g>
          )
        }

        const dx = to.x - from.x
        const dy = to.y - from.y
        const length = Math.hypot(dx, dy)
        const unitX = dx / length
        const unitY = dy / length
        const startX = from.x + unitX * nodeRadius
        const startY = from.y + unitY * nodeRadius
        const endX = to.x - unitX * nodeRadius
        const endY = to.y - unitY * nodeRadius
        const defaultPlacement: RoutedEdgePlacement = {
          curveOffset: 18,
          labelOffset: 14,
        }
        const chosenPlacement =
          routedPlacementByGroupKey.get(group.groupKey) ?? defaultPlacement
        const curveOffset = chosenPlacement.curveOffset
        const controlX = (startX + endX) / 2 + -unitY * curveOffset
        const controlY = (startY + endY) / 2 + unitX * curveOffset
        const labelX =
          0.25 * startX +
          0.5 * controlX +
          0.25 * endX +
          -unitY * chosenPlacement.labelOffset
        const labelY =
          0.25 * startY +
          0.5 * controlY +
          0.25 * endY +
          unitX * chosenPlacement.labelOffset

        return (
          <g key={group.groupKey}>
            <path
              d={`M ${startX} ${startY} Q ${controlX} ${controlY} ${endX} ${endY}`}
              fill="none"
              stroke={strokeColor}
              strokeWidth={strokeWidth}
              markerEnd="url(#arrow)"
            />
            <text
              x={labelX}
              y={labelY}
              textAnchor="middle"
              fill={textColor}
              stroke="#fbfdff"
              strokeWidth={4}
              paintOrder="stroke"
            >
              {group.transitions.map((transition, index) => (
                <tspan key={transition.symbol} x={labelX} dy={index === 0 ? 0 : 14}>
                  {transition.symbol}
                </tspan>
              ))}
            </text>
          </g>
        )
      })}

      {machine.states.map((state) => {
        const position = positions[state]
        const isAccepting = machine.acceptStates.includes(state)
        const isStart = machine.startState === state
        const isCurrent = currentState === state
        const isTraversed = traversedStates.has(state)

        return (
          <g key={state}>
            {isStart && (
              <line
                x1={position.x - 70}
                y1={position.y}
                x2={position.x - nodeRadius}
                y2={position.y}
                stroke="#2e4c76"
                strokeWidth="2"
                markerEnd="url(#arrow)"
              />
            )}
            <circle
              cx={position.x}
              cy={position.y}
              r={nodeRadius}
              className={[
                'state-node',
                isTraversed ? 'state-node-traversed' : '',
                isCurrent ? 'state-node-current' : '',
              ]
                .filter(Boolean)
                .join(' ')}
            />
            {isAccepting && (
              <circle
                cx={position.x}
                cy={position.y}
                r={nodeRadius - 6}
                className="state-node-accept"
              />
            )}
            <text x={position.x} y={position.y + 4} textAnchor="middle">
              {state}
            </text>
          </g>
        )
      })}
    </svg>
  )
}

function App() {
  function getDefaultUiStateByType(): UiStateByType {
    return {
      deterministicFiniteAutomaton: {
        definitionText: DETERMINISTIC_SAMPLE,
        inputString: '',
        simulationResult: null,
        activeStepIndex: -1,
        isAutoPlaying: false,
      },
      nondeterministicFiniteAutomaton: {
        definitionText: FUTURE_TEMPLATE,
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

  function loadPersistedUiConfig(): {
    selectedAutomatonType: AutomatonType
    definitionsByType: Record<AutomatonType, string>
    deterministicInputString: string
  } | null {
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
      }
      const maybeType = parsed.selectedAutomatonType
      const validType = AUTOMATON_OPTIONS.some((option) => option.id === maybeType)
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
            typeof persistedDefinitions.nondeterministicFiniteAutomaton === 'string'
              ? persistedDefinitions.nondeterministicFiniteAutomaton
              : fallbackDefinitions.nondeterministicFiniteAutomaton.definitionText,
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
      }
    } catch {
      return null
    }
  }

  const [persistedUiConfig] = useState(loadPersistedUiConfig)
  const [selectedAutomatonType, setSelectedAutomatonType] =
    useState<AutomatonType>(
      persistedUiConfig?.selectedAutomatonType ?? 'deterministicFiniteAutomaton',
    )
  const [uiStateByType, setUiStateByType] = useState<UiStateByType>({
    deterministicFiniteAutomaton: {
      definitionText:
        persistedUiConfig?.definitionsByType.deterministicFiniteAutomaton ??
        DETERMINISTIC_SAMPLE,
      inputString: persistedUiConfig?.deterministicInputString ?? '',
      simulationResult: null,
      activeStepIndex: -1,
      isAutoPlaying: false,
    },
    nondeterministicFiniteAutomaton: {
      definitionText:
        persistedUiConfig?.definitionsByType.nondeterministicFiniteAutomaton ??
        FUTURE_TEMPLATE,
    },
    pushdownAutomaton: {
      definitionText:
        persistedUiConfig?.definitionsByType.pushdownAutomaton ?? FUTURE_TEMPLATE,
    },
    queueAutomaton: {
      definitionText:
        persistedUiConfig?.definitionsByType.queueAutomaton ?? FUTURE_TEMPLATE,
    },
    turingMachine: {
      definitionText:
        persistedUiConfig?.definitionsByType.turingMachine ?? FUTURE_TEMPLATE,
    },
  })

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
          isAutoPlaying: nextValue >= maxIndex ? false : currentValue.isAutoPlaying,
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
      definitionsByType: {
        deterministicFiniteAutomaton:
          uiStateByType.deterministicFiniteAutomaton.definitionText,
        nondeterministicFiniteAutomaton:
          uiStateByType.nondeterministicFiniteAutomaton.definitionText,
        pushdownAutomaton: uiStateByType.pushdownAutomaton.definitionText,
        queueAutomaton: uiStateByType.queueAutomaton.definitionText,
        turingMachine: uiStateByType.turingMachine.definitionText,
      },
      deterministicInputString: uiStateByType.deterministicFiniteAutomaton.inputString,
    }

    try {
      window.localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(payload))
    } catch {
      // Ignore storage failures (private mode/quota limits).
    }
  }, [selectedAutomatonType, uiStateByType])

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

          {selectedOption.supported && (
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
                onChange={(event) => {
                  updateDeterministicUiState((currentValue) => ({
                    ...currentValue,
                    inputString: event.target.value,
                    simulationResult: null,
                    activeStepIndex: -1,
                    isAutoPlaying: false,
                  }))
                }}
                placeholder="Example: 10101 or a b a"
              />
              <button
                className="run-button"
                type="button"
                onClick={handleRunSimulation}
                disabled={!parseResult?.value}
              >
                Run
              </button>
              <div className="simulation-actions">
                <button
                  className="action-button"
                  type="button"
                  onClick={handleResetSimulationProgress}
                  disabled={
                    simulationResult === null ||
                    (activeStepIndex < 0 && !isAutoPlaying)
                  }
                >
                  Reset Progress
                </button>
                <button
                  className="action-button"
                  type="button"
                  onClick={handleClearSimulation}
                  disabled={
                    inputString.length === 0 &&
                    simulationResult === null &&
                    activeStepIndex < 0 &&
                    !isAutoPlaying
                  }
                >
                  Clear Simulation
                </button>
              </div>

              {!parseResult?.value && (
                <div className="simulation-error-box" role="alert">
                  <h3>Cannot Run Simulation</h3>
                  <p>Fix the machine definition errors before running.</p>
                  <ul>
                    {parseResult?.errors.map((error) => (
                      <li key={error}>{error}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
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
              <p>
                {selectedOption.label}
                {' '}
                support is planned in the roadmap.
              </p>
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
            <div
              className={
                simulationResult.accepted &&
                simulationResult.errors.length === 0
                  ? 'simulation-result simulation-result-accept'
                  : 'simulation-result simulation-result-reject'
              }
            >
              <h3>
                Result:
                {' '}
                {simulationResult.accepted &&
                simulationResult.errors.length === 0
                  ? 'Accept'
                  : 'Reject'}
              </h3>
              <p>
                Final state:
                {' '}
                <strong>{simulationResult.finalState}</strong>
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
                  Step:
                  {' '}
                  <strong>
                    {Math.max(0, activeStepIndex + 1)}
                    /
                    {totalTraceSteps}
                  </strong>
                  {' '}
                  | Current state:
                  {' '}
                  <strong>{activeState}</strong>
                </p>
                <div className="step-controls">
                  <button
                    className="step-button"
                    type="button"
                    onClick={() =>
                      updateDeterministicUiState((currentValue) => ({
                        ...currentValue,
                        activeStepIndex: currentValue.activeStepIndex - 1,
                      }))
                    }
                    disabled={!canStepBackward || isAutoPlaying}
                  >
                    Previous
                  </button>
                  <button
                    className="step-button"
                    type="button"
                    onClick={() =>
                      updateDeterministicUiState((currentValue) => ({
                        ...currentValue,
                        activeStepIndex: currentValue.activeStepIndex + 1,
                      }))
                    }
                    disabled={!canStepForward || isAutoPlaying}
                  >
                    Next
                  </button>
                  <button
                    className="step-button"
                    type="button"
                    onClick={handleStartAutoPlay}
                    disabled={!canAutoPlay || isAutoPlaying}
                  >
                    Auto-play
                  </button>
                  <button
                    className="step-button"
                    type="button"
                    onClick={() =>
                      updateDeterministicUiState((currentValue) => ({
                        ...currentValue,
                        isAutoPlaying: false,
                      }))
                    }
                    disabled={!isAutoPlaying}
                  >
                    Pause
                  </button>
                  <button
                    className="step-button"
                    type="button"
                    onClick={handleResetSimulationProgress}
                    disabled={simulationResult.trace.length === 0 && activeStepIndex < 0}
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
                        Read
                        {' '}
                        <strong>{step.symbol}</strong>
                        :
                        {' '}
                        {step.fromState}
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
          )}
        </div>
      </section>
    </main>
  )
}

export default App
