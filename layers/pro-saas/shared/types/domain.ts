// Curated cross-layer domain DTOs (ADR-0005). This module is imported by app
// and shared code, so it must not import the server database schema.

export type TeamRole = 'admin' | 'editor' | 'viewer'

export interface SiteProfile {
  type?: 'blog' | 'ecommerce' | 'saas' | 'docs' | 'portfolio' | 'other'
  industry?: string
  audience?: 'b2b' | 'b2c' | 'developers' | 'general'
  locale?: string
  contentTypes?: ('blog' | 'products' | 'docs' | 'landing')[]
  brandVoice?: 'formal' | 'casual' | 'technical'
  competitors?: string[]
  primaryKeywords?: string[]
  brandKeywords?: string[]
}

export interface SiteGroup {
  id: string
  teamId: string | null
  userId: string | null
  name: string
  order: number | null
  createdAt: Date | null
}

export interface Site {
  id: string
  userId: string
  teamId: string | null
  groupId: string | null
  url: string | null
  name: string | null
  order: number | null
  profile: SiteProfile | null
  profiledAt: Date | null
  lastVerifiedAt: Date | null
  gscdumpSiteId: string | null
  gscdumpSiteUrl: string | null
  gscdumpCredentialId: string | null
  createdAt: Date | null
}

export type SiteModuleFeatures = Record<string, boolean | string | number>

export interface SiteModule {
  id: string
  siteId: string
  name: string
  version: string | null
  secret: string | null
  features: SiteModuleFeatures | null
  lastStatus: Record<string, unknown> | null
  lastStatusAt: Date | null
  createdAt: Date | null
  updatedAt: Date | null
}

export interface CompetitorKeyword {
  keyword: string
  position: number
  volume: number
  traffic: number
}

export interface SharedKeyword {
  keyword: string
  yourPosition: number
  theirPosition: number
  volume: number
}

export interface SiteCompetitor {
  id: string
  siteId: string
  domain: string
  organicTraffic: number | null
  totalKeywords: number | null
  domainRank: number | null
  trafficValue: number | null
  topKeywords: CompetitorKeyword[] | null
  sharedKeywords: SharedKeyword[] | null
  keywordGaps: CompetitorKeyword[] | null
  lastFetchedAt: Date | null
  autoDiscovered: boolean | null
  createdAt: Date | null
}

export interface SiteCompetitorHistory {
  id: string
  competitorId: string
  organicTraffic: number | null
  totalKeywords: number | null
  domainRank: number | null
  trafficValue: number | null
  createdAt: Date | null
}

export interface SiteKeyword {
  id: string
  siteId: string
  keyword: string
  favorite: boolean | null
  volume: number | null
  difficulty: number | null
  intent: string | null
  cpc: number | null
  competitionLevel: string | null
  trend: Array<{ year: number, month: number, volume: number }> | null
  serpFeatures: string[] | null
  lastFetchedAt: Date | null
  createdAt: Date | null
}

export interface SiteKeywordHistory {
  id: string
  keywordId: string
  volume: number | null
  difficulty: number | null
  cpc: number | null
  createdAt: Date | null
}

export interface LhMonitoredPage {
  id: string
  siteId: string
  url: string
  path: string
  source: 'auto-gsc' | 'manual'
  enabled: boolean
  order: number
  lastScanAt: Date | null
  createdAt: Date | null
}

export interface LhScan {
  id: string
  siteId: string
  monitoredPageId: string | null
  url: string
  strategy: 'mobile' | 'desktop'
  status: 'running' | 'complete' | 'failed'
  trigger: 'scheduled' | 'manual'
  error: string | null
  lhrR2Key: string | null
  performanceScore: number | null
  accessibilityScore: number | null
  bestPracticesScore: number | null
  seoScore: number | null
  lcp: number | null
  cls: number | null
  tbt: number | null
  fcp: number | null
  si: number | null
  ttfb: number | null
  startedAt: Date | null
  completedAt: Date | null
}

export interface LhMetricDiff {
  name: string
  base: number
  current: number
  delta: number
  severity: 'improvement' | 'regression' | 'neutral'
}

export interface LhComparison {
  id: string
  baseScanId: string | null
  currentScanId: string
  monitoredPageId: string | null
  metricDiffs: LhMetricDiff[]
  overallSeverity: 'improvement' | 'regression' | 'neutral'
  createdAt: Date | null
}

export interface ContentBriefSerpResult {
  position: number
  url: string
  title: string
  domain: string
  snippet?: string
  wordCount?: number
}

export interface ContentBriefPaaItem {
  question: string
  answer?: string
}

export interface ContentBriefSerpSnapshot {
  fetchedAt: string
  topResults: ContentBriefSerpResult[]
  paa?: ContentBriefPaaItem[]
  aiOverviewPresent?: boolean
  serpFeatures?: string[]
  medianWordCount?: number
}

export interface ContentBriefOutlineItem {
  level: 'h1' | 'h2' | 'h3'
  heading: string
  tag?: 'intent-match' | 'your-strength' | 'gap' | 'from-paa' | 'from-aio'
  annotation?: string
  wordCountTarget?: number
  sourceResultUrls?: string[]
  existingCoverageExcerpt?: string
  existingCoverageUrl?: string
}

export interface ContentBriefInternalLink {
  url: string
  impressions?: number
  position?: number
  reasoning: string
  anchorSuggestion?: string
  excerpt?: string
}

export interface ContentBriefPayload {
  targetPage?: string
  currentRank?: number
  currentImpressions?: number
  currentClicks?: number
  serp?: ContentBriefSerpSnapshot
  outline?: ContentBriefOutlineItem[]
  internalLinks?: ContentBriefInternalLink[]
  summary?: string
  notes?: string[]
}

export interface ContentBrief {
  id: string
  siteId: string
  userId: string
  teamId: string | null
  keyword: string
  status: 'queued' | 'researching' | 'ready' | 'written' | 'published' | 'stale' | 'failed' | 'archived'
  payload: ContentBriefPayload | null
  error: string | null
  generatedAt: Date | null
  markedWrittenAt: Date | null
  markedPublishedAt: Date | null
  createdAt: Date | null
  updatedAt: Date | null
}

export interface MonthlyReportCwv {
  lcp: number | null
  inp: number | null
  cls: number | null
  overall: 'pass' | 'ni' | 'fail' | null
  history?: Array<{ date: string, lcp: number | null, inp: number | null, cls: number | null }>
  trend?: {
    lcp: 'improving' | 'stable' | 'regressing' | null
    inp: 'improving' | 'stable' | 'regressing' | null
    cls: 'improving' | 'stable' | 'regressing' | null
  }
}

export interface MonthlyReportPageMover {
  page: string
  clicks: number
  clicksChange: number
  clicksChangePercent: number
  impressions: number
  impressionsChange: number
  position: number
  previousPosition: number
}

export interface MonthlyReportStrikingDistance {
  keyword: string
  page?: string
  position: number
  previousPosition: number
  impressions: number
  impressionsChange: number
  clicks: number
  potentialClicks?: number
}

export interface MonthlyReportCtrOutlier {
  keyword: string
  page?: string
  position: number
  impressions: number
  clicks: number
  ctr: number
  missedClicks?: number
}

export interface MonthlyReportSegmentSlice {
  key: string
  clicks: number
  clicksDelta: number
  clicksDeltaPercent: number
  impressions: number
  sharePercent: number
}

export interface MonthlyReportIndexingDelta {
  totalDelta: number
  indexedDelta: number
  indexedPercentDelta: number
  newlyExcluded?: number
}

export interface MonthlyReportIndexingIssue {
  type: string
  label: string
  count: number
  severity: 'error' | 'warning' | 'info'
}

export interface MonthlyReportDeclinerEntry {
  keyword: string
  previousPosition: number
  position: number
  clicksChange: number
}

export interface MonthlyReportSiteBreakdown {
  siteId: string
  siteUrl: string
  clicks: number
  clicksDelta: number
  clicksDeltaPercent: number
  impressions: number
  impressionsDelta: number
  impressionsDeltaPercent: number
  position: number
  positionDelta: number
  topMover?: MonthlyReportDeclinerEntry
  indexing?: { totalUrls: number, indexed: number, indexedPercent: number }
  cwv?: MonthlyReportCwv
  topIssues?: MonthlyReportIndexingIssue[]
  topDecliners?: MonthlyReportDeclinerEntry[]
  pageMovers?: MonthlyReportPageMover[]
  strikingDistance?: MonthlyReportStrikingDistance[]
  ctrOutliers?: MonthlyReportCtrOutlier[]
  countrySplit?: MonthlyReportSegmentSlice[]
  deviceSplit?: MonthlyReportSegmentSlice[]
  indexingDelta?: MonthlyReportIndexingDelta
}

export interface MonthlyReportPayload {
  period: string
  periodLabel: string
  generatedAt: string
  user: { id: string, name: string | null, discordUsername: string | null }
  totals: {
    clicks: number
    clicksDelta: number
    clicksDeltaPercent: number
    impressions: number
    impressionsDelta: number
    impressionsDeltaPercent: number
    position: number
    positionDelta: number
  }
  topMovers: Array<MonthlyReportDeclinerEntry & { siteId: string, siteUrl: string, direction: 'up' | 'down' }>
  topDecliners?: Array<MonthlyReportDeclinerEntry & { siteId: string, siteUrl: string }>
  sites: MonthlyReportSiteBreakdown[]
  notes: string[]
  verbosity?: 'minimal' | 'medium' | 'verbose'
  templateId?: string | null
}
