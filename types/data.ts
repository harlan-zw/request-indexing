import type { searchconsole_v1 } from '@googleapis/searchconsole/v1'
import type { indexing_v3 } from '@googleapis/indexing/v3'
import type { RequiredNonNullable } from '~/types/util'

export interface IndexedUrl extends RequiredNonNullable<searchconsole_v1.Schema$ApiDataRow> {
}
export interface SitePage {
  url: string
  lastInspected?: number
  // inspect url gsc response
  inspectionResult?: searchconsole_v1.Schema$UrlInspectionResult
  // submit url for indexing response
  urlNotificationMetadata?: indexing_v3.Schema$UrlNotificationMetadata
}

export interface UserSite {
  urls: SitePage[]
  crawl?: {
    updatedAt: number
    urls: string[]
  }
}

export interface GoogleSearchConsoleSite {
  siteUrl: string
  permissionLevel: 'siteOwner' | 'siteRestrictedUser' | 'siteFullUser'
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
  sitemaps: searchconsole_v1.Schema$WmxSitemap[]
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
  nonIndexedPercent: number
  nonIndexedUrls: SitePage[]
}
