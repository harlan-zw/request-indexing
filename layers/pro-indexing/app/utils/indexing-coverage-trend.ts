export interface IndexingCoverageTrendSourcePoint {
  date: string
  totalUrls: number
  indexedCount: number | null
}

export interface IndexingCoverageTrendPoint extends Record<string, unknown> {
  date: string
  inspected: number
  indexed: number
}

export type IndexingCoverageTrend
  = | {
    _tag: 'insufficient'
    validPoints: number
  }
  | {
    _tag: 'ready'
    points: IndexingCoverageTrendPoint[]
    latest: IndexingCoverageTrendPoint
  }

export type IndexingCoverageTrendViewState
  = | { _tag: 'loading' }
    | { _tag: 'error' }
    | {
      _tag: 'loaded'
      trend: IndexingCoverageTrend
    }

export function formatIndexingCoverageDate(raw: unknown): string {
  const date = new Date(String(raw))
  if (Number.isNaN(date.getTime()))
    return String(raw)
  const month = [
    'Jan',
    'Feb',
    'Mar',
    'Apr',
    'May',
    'Jun',
    'Jul',
    'Aug',
    'Sep',
    'Oct',
    'Nov',
    'Dec',
  ][date.getUTCMonth()]
  if (!month)
    return String(raw)
  return `${date.getUTCDate()} ${month}`
}

function parsePoint(source: IndexingCoverageTrendSourcePoint): IndexingCoverageTrendPoint | null {
  const date = source.date.trim()
  const inspected = source.totalUrls
  const indexed = source.indexedCount
  if (
    !date
    || !Number.isSafeInteger(inspected)
    || indexed == null
    || !Number.isSafeInteger(indexed)
    || inspected < 0
    || indexed < 0
    || indexed > inspected
  ) {
    return null
  }
  return { date, inspected, indexed }
}

export function buildIndexingCoverageTrend(
  source: ReadonlyArray<IndexingCoverageTrendSourcePoint>,
): IndexingCoverageTrend {
  const pointsByDate = new Map<string, IndexingCoverageTrendPoint>()
  for (const row of source) {
    const point = parsePoint(row)
    if (point)
      pointsByDate.set(point.date, point)
  }

  const points = [...pointsByDate.values()]
    .sort((left, right) => left.date.localeCompare(right.date))

  const latest = points.at(-1)
  if (points.length < 2 || !latest) {
    return {
      _tag: 'insufficient',
      validPoints: points.length,
    }
  }

  return {
    _tag: 'ready',
    points,
    latest,
  }
}
