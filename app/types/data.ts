export interface GscDataRow {
  clicks: number
  impressions: number
  ctr: number
  position: number
  keys?: string[]
}

export interface GscDataComparison<T extends GscDataRow> {
  period: T[]
  prevPeriod: T[]
}

export interface SitePage extends GscDataRow {
  url: string
  lastInspected?: number
  inspectionResult?: any
  urlNotificationMetadata?: any
}

export interface UserSite {
  urls: SitePage[]
  crawl?: {
    updatedAt: number
    urls: string[]
  }
}

export interface ResolvedAnalyticsRange {
  period: {
    start: Date | string
    end: Date | string
  }
  prevPeriod?: {
    start: Date
    end: Date
  }
}

export interface SiteAnalytics {
  analytics: {
    period: {
      totalClicks: number
      totalImpressions: number
    }
    prevPeriod: {
      totalClicks: number
      totalImpressions: number
    }
  }
  sitemaps: any[]
  indexedUrls: string[]
  period: {
    url: string
    clicks: number
    clicksPercent: number
    prevClicks: number
    impressions: number
    impressionsPercent: number
    prevImpressions: number
  }[]
  keywords: {
    keyword: string
    position: number
    prevPosition: number
    positionPercent: number
    ctr: number
    ctrPercent: number
    prevCtr: number
    clicks: number
  }[]
  graph: {
    keys?: undefined
    time: string
    clicks: number
    impressions: number
  }[]
}

export interface SiteExpanded extends SiteAnalytics, GoogleSearchConsoleSite {
  requiresActionPercent: number
  nonIndexedUrls: SitePage[]
}

export interface SitePreview {
  sitemaps: any[]
  siteId: string
  domain: string
  pageCount30Day: number
  startOfData: string
  isLosingData: boolean
}

export type SitesPreview = SitePreview[]
