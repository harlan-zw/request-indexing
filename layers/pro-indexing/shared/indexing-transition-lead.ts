import type { IndexCohortCell } from './index-cohorts'

export interface IndexingTransitionEvidence {
  url: string
  field: string
  fromValue: string | null
  toValue: string | null
  changedAfter: string
  changedBefore: string
}

export type IndexingRegressionLead
  = {
    _tag: 'lead'
    count: number
    detail: string
    end: string
    start: string
    title: string
  }
  | {
    _tag: 'none'
    reason: 'cohort-has-no-path' | 'no-index-regression'
  }

function pathBelongsTo(path: string, prefix: string): boolean {
  return path === prefix || path.startsWith(`${prefix.replace(/\/$/, '')}/`)
}

function transitionTime(value: string): number | null {
  const time = Date.parse(value)
  return Number.isFinite(time) ? time : null
}

function formatTransitionDate(value: string): string {
  return new Intl.DateTimeFormat('en-AU', {
    day: 'numeric',
    month: 'short',
    timeZone: 'UTC',
    year: 'numeric',
  }).format(new Date(value))
}

export function selectIndexingRegressionLead(
  cohort: Pick<IndexCohortCell, 'label' | 'pathPrefix'>,
  transitions: readonly IndexingTransitionEvidence[],
): IndexingRegressionLead {
  const prefix = cohort.pathPrefix
  if (!prefix)
    return { _tag: 'none', reason: 'cohort-has-no-path' }

  const regressions = transitions.flatMap((transition) => {
    if (
      transition.field !== 'indexStatus'
      || transition.fromValue !== 'PASS'
      || transition.toValue === 'PASS'
      || !URL.canParse(transition.url)
    ) {
      return []
    }
    const start = transitionTime(transition.changedAfter)
    const end = transitionTime(transition.changedBefore)
    if (start === null || end === null || end < start)
      return []
    if (!pathBelongsTo(new URL(transition.url).pathname, prefix))
      return []
    return [{ ...transition, end, start }]
  })

  if (!regressions.length)
    return { _tag: 'none', reason: 'no-index-regression' }

  const uniqueUrls = new Set(regressions.map(transition => transition.url))
  const start = regressions.reduce((earliest, transition) =>
    transition.start < earliest.start ? transition : earliest)
  const end = regressions.reduce((latest, transition) =>
    transition.end > latest.end ? transition : latest)
  const count = uniqueUrls.size

  return {
    _tag: 'lead',
    count,
    detail: 'URL Inspection samples bound the change window; they do not identify the exact drop time.',
    end: end.changedBefore,
    start: start.changedAfter,
    title: `Google dropped ${count.toLocaleString()} ${count === 1 ? 'page' : 'pages'} in ${cohort.label} between ${formatTransitionDate(start.changedAfter)} and ${formatTransitionDate(end.changedBefore)}.`,
  }
}
