import type { DeterministicFiniteAutomaton } from '../types/automaton'

interface AutomatonGraphProps {
  machine: DeterministicFiniteAutomaton
  currentState?: string | null
  currentStates?: Set<string>
  traversedStates?: Set<string>
  traversedTransitionKeys?: Set<string>
  activeTransitionKey?: string | null
}

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

  const maxReachableDistance = Math.max(0, ...Array.from(distances.values()))
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

function AutomatonGraph({
  machine,
  currentState = null,
  currentStates = new Set<string>(),
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
    return Math.min(
      ...points.map((otherPoint) => pointDistance(point, otherPoint)),
    )
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

  const selfLoopGroups = transitionGroups.filter(
    (group) => group.from === group.to,
  )
  const nonSelfGroups = transitionGroups.filter(
    (group) => group.from !== group.to,
  )

  const selfLoopDirectionCandidates = [-Math.PI / 2]

  function getSelfLoopCandidatePlacement(
    group: {
      from: string
      to: string
      groupKey: string
      transitions: DeterministicFiniteAutomaton['transitions']
    },
    directionAngle: number,
  ): { placement: SelfLoopPlacement; score: number } {
    const center = positions[group.from]
    const radialX = Math.cos(directionAngle)
    const radialY = Math.sin(directionAngle)
    const tangentX = -Math.sin(directionAngle)
    const tangentY = Math.cos(directionAngle)
    const spread = 12
    const bulge = nodeRadius + 46
    const labelDistance =
      nodeRadius + 62 + Math.max(0, group.transitions.length - 1) * 6

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
    const score =
      minCurveClearanceToNodeEdge * 2.2 +
      labelClearanceToNodeEdge +
      routeClearance * 1.1

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
    let best = getSelfLoopCandidatePlacement(
      group,
      selfLoopDirectionCandidates[0],
    )
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
    const baseCurveMagnitude = Math.max(
      20,
      Math.min(34, geometry.length * 0.13),
    )
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
      const labelOffset =
        sign * Math.max(16, Math.min(30, curveMagnitude * 0.35))
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
        ...curvePoints.map((point) =>
          minDistanceToNodeEdges(point, excludedStates),
        ),
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
      const secondPositive = getCandidatePlacement(second, 1, true)
      const scoreOptionA = firstPositive.score + secondPositive.score

      const firstNegative = getCandidatePlacement(first, -1, true)
      const secondNegative = getCandidatePlacement(second, -1, true)
      const scoreOptionB = firstNegative.score + secondNegative.score

      const chosen =
        scoreOptionA >= scoreOptionB
          ? [
              { group: first, placement: firstPositive },
              { group: second, placement: secondPositive },
            ]
          : [
              { group: first, placement: firstNegative },
              { group: second, placement: secondNegative },
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
        const isActive = transitionKeys.some(
          (key) => key === activeTransitionKey,
        )
        const strokeColor = isActive
          ? '#d36b1f'
          : isTraversed
            ? '#2f7f4f'
            : '#2e4c76'
        const textColor = isActive
          ? '#8d3f08'
          : isTraversed
            ? '#1d5b34'
            : '#10284a'
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
                <tspan
                  key={transition.symbol}
                  x={labelX}
                  dy={index === 0 ? 0 : 14}
                >
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
        const isCurrent =
          currentStates.size > 0
            ? currentStates.has(state)
            : currentState === state
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

export default AutomatonGraph
