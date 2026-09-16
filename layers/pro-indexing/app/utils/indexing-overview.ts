import type { SearchConsoleStageIssue } from '@gscdump/sdk/search-console-stage'
import type { TrustGate } from '../../shared/contracts/trust-gate'
import type {
  IndexingDiagnosis,
  IndexingDiagnosisAction,
  IndexingEvidenceUrl,
} from '../../shared/indexing-diagnosis'
import { diagnoseIndexing } from '../../shared/indexing-diagnosis'
import { compareCurrentSitemapScope } from '../../shared/trust-gate'

export interface IndexingOverviewInput {
  totalUrls: number
  indexed: number
  issues: SearchConsoleStageIssue[]
  indexingStatus: 'pending' | 'partial' | 'complete' | null
  inspectedCount: number
  sitemapTotal: number
  sitemapHistory: ReadonlyArray<{ date: string, urlCount: number }>
  sampleUrls?: IndexingEvidenceUrl[]
  pipeline: IndexingPipelineEvidence
  trust: TrustGate
}

export interface IndexingOverviewCount {
  id: string
  value: number
  label: string
}

export interface IndexingOverviewReason {
  issueType: string
  label: string
  count: number
  countLabel: string
  severity: NonNullable<SearchConsoleStageIssue['severity']>
}

export interface IndexingOverviewReasonGroup {
  id: IndexingReasonGroupId
  label: string
  countLabel: string
  reasons: IndexingOverviewReason[]
}

export interface IndexingOverviewAction {
  engineActionId: IndexingDiagnosisAction['id']
  issueType: string | null
  label: string
  detail: string
  buttonLabel: string
}

interface OverviewScope {
  inspected: number
  indexed: number
  indexedLabel: string
  sitemapTotal: number
  complete: boolean
}

export type IndexingReasonGroupId
  = | 'crawl_fetch'
    | 'discovery'
    | 'indexability'
    | 'selection'
    | 'unknown'
    | 'other'

interface IndexingPipelineUrl {
  verdict?: string | null
  indexingState?: string | null
  robotsTxtState?: string | null
  pageFetchState?: string | null
  lastCrawlTime?: string | null
}

interface IndexingPipelineSource {
  urls: ReadonlyArray<IndexingPipelineUrl>
  pagination: {
    total: number
    hasMore: boolean
  }
  inspectedCount: number
}

interface AvailablePipelineEvidence {
  _tag: 'available'
  inspected: number
  crawled: number
  indexable: number
  indexed: number
}

interface UnavailablePipelineEvidence {
  _tag: 'unavailable'
  reason: 'partial_rows' | 'scope_mismatch'
}

export type IndexingPipelineEvidence
  = | AvailablePipelineEvidence
    | UnavailablePipelineEvidence

export interface IndexingOverviewPipelineStep {
  id: 'inspected' | 'crawled' | 'indexable' | 'indexed'
  label: 'Inspected' | 'Crawled' | 'Indexable' | 'Indexed'
  value: number
  countLabel: string
}

export interface IndexingOverviewPipeline {
  _tag: 'available'
  steps: [
    IndexingOverviewPipelineStep,
    IndexingOverviewPipelineStep,
    IndexingOverviewPipelineStep,
    IndexingOverviewPipelineStep,
  ]
  largestLoss: {
    from: IndexingOverviewPipelineStep['label']
    to: IndexingOverviewPipelineStep['label']
    count: number
  } | null
}

interface WaitingModel {
  _tag: 'waiting'
  /**
   * Which setup gate produced the wait. `not_connected` needs a connect action;
   * `pending` needs patience. Collapsing both into one branch left the connect
   * case with copy that asked for a link and no way to follow it.
   */
  state: 'not_connected' | 'pending'
  reason: string
  progress: {
    inspected: number
    total: number
  } | null
}

interface TrustFailureModel {
  _tag: 'trust_failure'
  reason: string
  state: 'unknown' | 'broken' | 'no_sitemap'
}

interface VerifyScopeModel {
  _tag: 'verify_scope'
  current: number
  highWater: number
  reason: string
}

interface PartialScopeModel {
  _tag: 'partial_scope'
  scope: OverviewScope
  reason: string
}

export interface DiagnosisModel {
  _tag: 'diagnosis'
  diagnosis: IndexingDiagnosis
  scope: OverviewScope
  counts: IndexingOverviewCount[]
  reasonGroups: IndexingOverviewReasonGroup[]
  pipeline: IndexingOverviewPipeline | UnavailablePipelineEvidence
  primaryAction: IndexingOverviewAction | null
  trustNote: string | null
}

export type IndexingOverviewModel
  = | WaitingModel
    | TrustFailureModel
    | VerifyScopeModel
    | PartialScopeModel
    | DiagnosisModel

const hardCrawlIssueTypes = new Set([
  'blocked_robots',
  'server_error',
  'access_denied',
  'access_forbidden',
  'blocked_4xx',
  'redirect_error',
  'crawl_error',
  'not_found',
  'soft_404',
])

const issueGroupByType: Readonly<Record<string, IndexingReasonGroupId>> = {
  blocked_robots: 'crawl_fetch',
  server_error: 'crawl_fetch',
  access_denied: 'crawl_fetch',
  access_forbidden: 'crawl_fetch',
  blocked_4xx: 'crawl_fetch',
  redirect_error: 'crawl_fetch',
  crawl_error: 'crawl_fetch',
  not_found: 'crawl_fetch',
  soft_404: 'crawl_fetch',
  discovered_not_indexed: 'discovery',
  canonical_mismatch: 'indexability',
  canonical_cross_domain: 'indexability',
  noindex: 'indexability',
  duplicate_no_canonical: 'indexability',
  crawled_not_indexed: 'selection',
  unknown_to_google: 'unknown',
}

const reasonGroupLabels = {
  crawl_fetch: 'Crawl or fetch faults',
  discovery: 'Discovered, not crawled',
  indexability: 'Canonical or indexability faults',
  selection: 'Crawled, not indexed',
  unknown: 'Unknown to Google',
  other: 'Other indexing reasons',
} satisfies Record<IndexingReasonGroupId, string>

function formatNumber(value: number): string {
  return new Intl.NumberFormat('en').format(Math.max(0, Math.round(value)))
}

export function buildIndexingPipelineEvidence(input: IndexingPipelineSource): IndexingPipelineEvidence {
  const inspected = Math.max(0, Math.round(input.inspectedCount))
  const total = Math.max(0, Math.round(input.pagination.total))
  if (input.pagination.hasMore || input.urls.length !== total)
    return { _tag: 'unavailable', reason: 'partial_rows' }
  if (total !== inspected)
    return { _tag: 'unavailable', reason: 'scope_mismatch' }

  let crawled = 0
  let indexable = 0
  let indexed = 0
  for (const row of input.urls) {
    const isIndexed = row.verdict === 'PASS'
    const isCrawled = isIndexed
      || Boolean(row.lastCrawlTime)
      || row.pageFetchState === 'SUCCESSFUL'
    const isIndexable = isIndexed
      || (
        isCrawled
        && row.pageFetchState === 'SUCCESSFUL'
        && row.indexingState === 'INDEXING_ALLOWED'
        && row.robotsTxtState !== 'DISALLOWED'
      )

    if (isCrawled)
      crawled++
    if (isIndexable)
      indexable++
    if (isIndexed)
      indexed++
  }

  return {
    _tag: 'available',
    inspected,
    crawled,
    indexable,
    indexed,
  }
}

function buildOverviewPipeline(
  evidence: IndexingPipelineEvidence,
  inspected: number,
): IndexingOverviewPipeline | UnavailablePipelineEvidence {
  if (evidence._tag === 'unavailable')
    return evidence
  if (evidence.inspected !== inspected)
    return { _tag: 'unavailable', reason: 'scope_mismatch' }

  const values = [
    evidence.inspected,
    Math.min(evidence.inspected, evidence.crawled),
    Math.min(evidence.crawled, evidence.indexable),
    Math.min(evidence.indexable, evidence.indexed),
  ]
  const labels = ['Inspected', 'Crawled', 'Indexable', 'Indexed'] as const
  const ids = ['inspected', 'crawled', 'indexable', 'indexed'] as const
  const steps = values.map((value, index) => ({
    id: ids[index]!,
    label: labels[index]!,
    value,
    countLabel: denominatorLabel(value, inspected),
  })) as IndexingOverviewPipeline['steps']

  let largestLoss: IndexingOverviewPipeline['largestLoss'] = null
  for (let index = 1; index < steps.length; index++) {
    const previous = steps[index - 1]!
    const current = steps[index]!
    const count = previous.value - current.value
    if (count > 0 && (!largestLoss || count > largestLoss.count)) {
      largestLoss = {
        from: previous.label,
        to: current.label,
        count,
      }
    }
  }

  return { _tag: 'available', steps, largestLoss }
}

function denominatorLabel(value: number, inspected: number): string {
  return `${formatNumber(value)} of ${formatNumber(inspected)} inspected`
}

function issueTypeForAction(action: IndexingDiagnosisAction, issues: SearchConsoleStageIssue[]): string | null {
  const candidateTypes = (() => {
    switch (action.id) {
      case 'fix-crawl-access':
        return issues.filter(issue => hardCrawlIssueTypes.has(issue.type)).map(issue => issue.type)
      case 'align-indexability-signals':
        return ['canonical_cross_domain', 'canonical_mismatch', 'noindex', 'duplicate_no_canonical']
      case 'improve-discovery':
        return ['unknown_to_google']
      case 'strengthen-crawl-priority':
        return ['discovered_not_indexed']
      case 'improve-or-consolidate-content':
      case 'run-url-level-triage':
        return ['crawled_not_indexed', 'not_indexed']
      case 'complete-indexing-data':
        return []
    }
  })()

  if (action.id === 'fix-crawl-access') {
    return issues
      .filter(issue => candidateTypes.includes(issue.type) && issue.count > 0)
      .sort((a, b) => b.count - a.count)
      .at(0)
      ?.type ?? null
  }

  return candidateTypes
    .map(type => issues.find(issue => issue.type === type && issue.count > 0))
    .find(Boolean)
    ?.type ?? null
}

const actionIdsByReason = {
  none: [],
  crawl_blocked: ['fix-crawl-access'],
  canonical_or_indexability_blocked: ['align-indexability-signals'],
  unknown_to_google_discovery_gap: ['improve-discovery'],
  discovered_not_crawled: ['strengthen-crawl-priority'],
  crawled_not_indexed_quality_selection: ['improve-or-consolidate-content', 'run-url-level-triage'],
  not_indexed_unspecified: ['run-url-level-triage'],
  mixed_indexing_failure: ['run-url-level-triage'],
  data_incomplete: ['complete-indexing-data'],
} satisfies Record<IndexingDiagnosis['reason'], IndexingDiagnosisAction['id'][]>

function actionForDiagnosis(diagnosis: IndexingDiagnosis): IndexingDiagnosisAction | undefined {
  const alignedIds: readonly IndexingDiagnosisAction['id'][] = actionIdsByReason[diagnosis.reason]
  return diagnosis.recommendedActions.find(action => alignedIds.includes(action.id))
    ?? diagnosis.recommendedActions[0]
}

export function indexingActionForIssue(
  diagnosis: IndexingDiagnosis,
  issueType: string,
): IndexingDiagnosisAction | undefined {
  const alignedIds: ReadonlyArray<IndexingDiagnosisAction['id']> = (() => {
    if (hardCrawlIssueTypes.has(issueType))
      return ['fix-crawl-access']
    if (['noindex', 'canonical_mismatch', 'canonical_cross_domain', 'duplicate_no_canonical', 'alternate_canonical'].includes(issueType))
      return ['align-indexability-signals']
    if (issueType === 'unknown_to_google')
      return ['improve-discovery']
    if (issueType === 'discovered_not_indexed')
      return ['strengthen-crawl-priority']
    if (['crawled_not_indexed', 'not_indexed'].includes(issueType))
      return ['improve-or-consolidate-content', 'run-url-level-triage']
    return []
  })()

  return diagnosis.recommendedActions.find(action => alignedIds.includes(action.id))
}

function buttonLabelForAction(action: IndexingDiagnosisAction): string {
  switch (action.id) {
    case 'fix-crawl-access':
      return 'Review blocked URLs'
    case 'align-indexability-signals':
      return 'Review conflicting URLs'
    case 'improve-discovery':
      return 'Review unknown URLs'
    case 'strengthen-crawl-priority':
      return 'Review uncrawled URLs'
    case 'improve-or-consolidate-content':
    case 'run-url-level-triage':
      return 'Review crawled URLs'
    case 'complete-indexing-data':
      return 'View inspected URLs'
  }
}

function labelForAction(action: IndexingDiagnosisAction): string {
  switch (action.id) {
    case 'fix-crawl-access':
      return 'Fix crawl or fetch blockers'
    case 'align-indexability-signals':
      return 'Align indexability signals'
    case 'improve-discovery':
      return 'Make these URLs discoverable'
    case 'strengthen-crawl-priority':
      return 'Strengthen crawl priority'
    case 'improve-or-consolidate-content':
      return 'Improve or consolidate these pages'
    case 'run-url-level-triage':
      return 'Inspect crawled URLs before changing content'
    case 'complete-indexing-data':
      return 'Complete URL Inspection data'
  }
}

function detailForAction(action: IndexingDiagnosisAction): string {
  switch (action.id) {
    case 'fix-crawl-access':
      return 'Remove unintended robots blocks, response errors, authentication, or redirect failures.'
    case 'align-indexability-signals':
      return 'Remove unintended noindex directives and align canonicals, redirects, sitemap URLs, and internal links.'
    case 'improve-discovery':
      return 'Put canonical URLs in the sitemap and link to them from indexed pages.'
    case 'strengthen-crawl-priority':
      return 'Reduce low-value URL inventory and link to important canonical pages from already-indexed pages.'
    case 'improve-or-consolidate-content':
      return 'Compare rendered content, duplicate intent, canonicals, and internal links before requesting indexing again.'
    case 'run-url-level-triage':
      return 'Check fetch, robots, noindex, canonicals, rendered content, and duplication before changing pages in bulk.'
    case 'complete-indexing-data':
      return 'Finish URL Inspection collection before assigning a cause.'
  }
}

function groupReasons(
  issues: SearchConsoleStageIssue[],
  inspected: number,
  primaryIssueType: string | null,
): IndexingOverviewReasonGroup[] {
  const groups = new Map<IndexingReasonGroupId, IndexingOverviewReason[]>()
  for (const issue of issues) {
    if (issue.count <= 0 || issue.type === 'not_indexed')
      continue
    const groupId = issueGroupByType[issue.type]
    if (!groupId)
      continue
    const group = groups.get(groupId) ?? []
    group.push({
      issueType: issue.type,
      label: issue.label,
      count: issue.count,
      countLabel: denominatorLabel(issue.count, inspected),
      severity: issue.severity ?? 'info',
    })
    groups.set(groupId, group)
  }

  const primaryGroup = primaryIssueType
    ? issueGroupByType[primaryIssueType] ?? 'other'
    : null
  return Array.from(groups.entries(), ([id, reasons]) => {
    const sortedReasons = reasons.sort((left, right) =>
      Number(right.issueType === primaryIssueType) - Number(left.issueType === primaryIssueType)
      || right.count - left.count,
    )
    return {
      id,
      label: reasonGroupLabels[id],
      countLabel: denominatorLabel(
        reasons.reduce((total, reason) => total + reason.count, 0),
        inspected,
      ),
      reasons: sortedReasons.slice(0, 3),
    }
  })
    .sort((left, right) =>
      Number(right.id === primaryGroup) - Number(left.id === primaryGroup)
      || Math.max(...right.reasons.map(reason => reason.count)) - Math.max(...left.reasons.map(reason => reason.count)),
    )
    .slice(0, 3)
}

export function buildIndexingOverviewModel(input: IndexingOverviewInput): IndexingOverviewModel {
  if (input.trust.state === 'not_connected' || input.trust.state === 'pending') {
    return {
      _tag: 'waiting',
      state: input.trust.state,
      reason: input.trust.reason,
      progress: input.sitemapTotal > 0
        ? {
            inspected: Math.max(0, input.inspectedCount),
            total: Math.max(0, input.sitemapTotal),
          }
        : null,
    }
  }

  if (input.trust.state === 'unknown' || input.trust.state === 'broken' || input.trust.state === 'no_sitemap') {
    return {
      _tag: 'trust_failure',
      state: input.trust.state,
      reason: input.trust.reason,
    }
  }

  const sitemapScope = compareCurrentSitemapScope(input.sitemapHistory.map(point => point.urlCount))
  if (sitemapScope?.collapsed) {
    return {
      _tag: 'verify_scope',
      current: sitemapScope.current,
      highWater: sitemapScope.highWater,
      reason: `Today's sitemap scope is ${formatNumber(sitemapScope.current)} URLs, down from a recent high of ${formatNumber(sitemapScope.highWater)}.`,
    }
  }

  const inspected = Math.max(0, input.inspectedCount || input.totalUrls)
  const complete = input.indexingStatus === 'complete'
    && (input.sitemapTotal <= 0 || inspected >= input.sitemapTotal)
  const scope: OverviewScope = {
    inspected,
    indexed: Math.max(0, input.indexed),
    indexedLabel: denominatorLabel(input.indexed, inspected),
    sitemapTotal: Math.max(0, input.sitemapTotal),
    complete,
  }
  const diagnosis = diagnoseIndexing({
    totalUrls: input.totalUrls,
    indexed: input.indexed,
    issues: input.issues,
    sampleUrls: input.sampleUrls,
  })

  if (diagnosis.reason === 'none' && !complete) {
    return {
      _tag: 'partial_scope',
      scope,
      reason: `${formatNumber(inspected)} of ${formatNumber(input.sitemapTotal)} sitemap URLs are inspected. Keep collecting evidence before calling coverage complete.`,
    }
  }

  const action = actionForDiagnosis(diagnosis)
  const primaryAction = action
    ? {
        engineActionId: action.id,
        issueType: issueTypeForAction(action, input.issues),
        label: labelForAction(action),
        detail: detailForAction(action),
        buttonLabel: buttonLabelForAction(action),
      }
    : null
  const reasonGroups = groupReasons(input.issues, inspected, primaryAction?.issueType ?? null)
  const reasons = reasonGroups.flatMap(group => group.reasons)

  return {
    _tag: 'diagnosis',
    diagnosis,
    scope,
    counts: [
      { id: 'indexed', value: input.indexed, label: denominatorLabel(input.indexed, inspected) },
      { id: 'not-indexed', value: Math.max(0, input.totalUrls - input.indexed), label: denominatorLabel(Math.max(0, input.totalUrls - input.indexed), inspected) },
      ...reasons.map(reason => ({
        id: reason.issueType,
        value: reason.count,
        label: reason.countLabel,
      })),
    ],
    reasonGroups,
    pipeline: buildOverviewPipeline(input.pipeline, inspected),
    primaryAction,
    trustNote: input.trust.state === 'blip' ? input.trust.reason : null,
  }
}
