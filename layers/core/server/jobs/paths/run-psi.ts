import type { pagespeedonline_v5 } from '@googleapis/pagespeedonline'
import { format } from 'date-fns'
import { defu } from 'defu'
import { and, eq } from 'drizzle-orm'
import { withBase } from 'ufo'
import { incrementUsage } from '~~/layers/core/server/app/services/usage'
import {
  siteDateAnalytics,
  sitePageSpeedInsightScanAudits,
  sitePageSpeedInsightScans,
  sitePathDateAnalytics,
  sites,
} from '~~/layers/core/server/db/schema'
import { chunkedBatch } from '~~/layers/core/server/utils/drizzle'
import { broadcastToUser } from '~~/layers/core/server/utils/event-service'
import { defineJob } from '../_types'

function ucFirst(s: string) {
  return s.charAt(0).toUpperCase() + s.slice(1)
}

export default defineJob({
  name: 'paths/run-psi',
  queue: 'psi',
  async handle(payload, ctx) {
    const { siteId, path, strategy } = payload
    const db = ctx.db

    const site = await db.query.sites.findFirst({
      with: {
        owner: true,
      },
      where: eq(sites.siteId, siteId),
    }) as (typeof sites.$inferSelect & { owner: { publicId: string } | null }) | undefined

    if (!site)
      throw new Error('Site not found')

    const entry = await db.insert(sitePageSpeedInsightScans).values({
      siteId,
      path,
      strategy,
    }).returning()

    await incrementUsage(site!.siteId, 'psi')
    const { pagespeedonline } = await import('@googleapis/pagespeedonline')
    const api = pagespeedonline({
      version: 'v5',
      auth: useRuntimeConfig().google.cruxApiToken,
    })

    const res = await api.pagespeedapi.runpagespeed({
      url: withBase(path, site!.domain!),
      category: ['ACCESSIBILITY', 'BEST_PRACTICES', 'PERFORMANCE', 'SEO'],
      strategy,
    })
      .then(res => res.data as pagespeedonline_v5.Schema$PagespeedApiPagespeedResponseV5)
      .catch(() => false as const)

    if (res === false || !res.lighthouseResult || !res.lighthouseResult.audits || !res.lighthouseResult.categories)
      return
    const lhr = res.lighthouseResult
    const audits = lhr.audits as Record<string, pagespeedonline_v5.Schema$LighthouseAuditResultV5>
    const categories = lhr.categories as Record<string, pagespeedonline_v5.Schema$LighthouseCategoryV5>

    // Origin loading experience → siteDateAnalytics
    if (res.originLoadingExperience) {
      const metrics = res.originLoadingExperience.metrics || {}
      const metricPayload: Record<string, unknown> = {}
      if (metrics.CUMULATIVE_LAYOUT_SHIFT_SCORE)
        metricPayload[`${strategy}OriginCls75`] = metrics.CUMULATIVE_LAYOUT_SHIFT_SCORE.percentile
      if (metrics.EXPERIMENTAL_TIME_TO_FIRST_BYTE)
        metricPayload[`${strategy}OriginTtfb75`] = metrics.EXPERIMENTAL_TIME_TO_FIRST_BYTE.percentile
      if (metrics.FIRST_CONTENTFUL_PAINT_MS)
        metricPayload[`${strategy}OriginFcp75`] = metrics.FIRST_CONTENTFUL_PAINT_MS.percentile
      if (metrics.LARGEST_CONTENTFUL_PAINT_MS)
        metricPayload[`${strategy}OriginLcp75`] = metrics.LARGEST_CONTENTFUL_PAINT_MS.percentile
      if (metrics.INTERACTION_TO_NEXT_PAINT)
        metricPayload[`${strategy}OriginInp75`] = metrics.INTERACTION_TO_NEXT_PAINT.percentile
      await db.update(siteDateAnalytics)
        .set({
          [`${strategy}OriginLoadingExperience`]: res.originLoadingExperience,
          ...metricPayload,
        })
        .where(and(
          eq(siteDateAnalytics.siteId, siteId),
          eq(siteDateAnalytics.date, format(new Date(), 'yyyy-MM-dd')),
        ))
    }

    // Page loading experience → sitePathDateAnalytics
    if (res.loadingExperience) {
      const metrics = res.loadingExperience.metrics || {}
      const pathPayload: Record<string, unknown> = {
        [`${strategy}LoadingExperience`]: res.loadingExperience,
      }
      if (metrics.CUMULATIVE_LAYOUT_SHIFT_SCORE)
        pathPayload[`${strategy}Cls75`] = metrics.CUMULATIVE_LAYOUT_SHIFT_SCORE.percentile
      if (metrics.EXPERIMENTAL_TIME_TO_FIRST_BYTE)
        pathPayload[`${strategy}Ttfb75`] = metrics.EXPERIMENTAL_TIME_TO_FIRST_BYTE.percentile
      if (metrics.FIRST_CONTENTFUL_PAINT_MS)
        pathPayload[`${strategy}Fcp75`] = metrics.FIRST_CONTENTFUL_PAINT_MS.percentile
      if (metrics.LARGEST_CONTENTFUL_PAINT_MS)
        pathPayload[`${strategy}Lcp75`] = metrics.LARGEST_CONTENTFUL_PAINT_MS.percentile
      if (metrics.INTERACTION_TO_NEXT_PAINT)
        pathPayload[`${strategy}Inp75`] = metrics.INTERACTION_TO_NEXT_PAINT.percentile
      await db.update(sitePathDateAnalytics)
        .set(pathPayload)
        .where(and(
          eq(sitePathDateAnalytics.siteId, siteId),
          eq(sitePathDateAnalytics.date, format(new Date(), 'yyyy-MM-dd')),
          eq(sitePathDateAnalytics.path, path),
        ))
    }

    // Store blob reports
    const reportBlob = await useBlob().put(`psi:${siteId}:${path}:${strategy}:lighthouse.json`, JSON.stringify(res), { contentType: 'application/json' })
    const screenshotData = (audits['final-screenshot']?.details as { data?: string } | undefined)?.data
    const reportScreenshotBlob = screenshotData
      ? await useBlob().put(`psi:${siteId}:${path}:${strategy}:screenshot.png`, screenshotData, { contentType: 'image/png' })
      : undefined

    await db.update(sitePageSpeedInsightScans).set({
      performance: categories.performance?.score ?? undefined,
      seo: categories.seo?.score ?? undefined,
      accessibility: categories.accessibility?.score ?? undefined,
      bestPractices: categories['best-practices']?.score ?? undefined,
      reportBlob,
      reportScreenshotBlob,
    }).where(eq(sitePageSpeedInsightScans.sitePageSpeedInsightScanId, entry[0]!.sitePageSpeedInsightScanId))

    function findCategoryForAuditId(auditId: string) {
      let category: { weight: number, category: string } | null = null
      Object.values(categories).forEach((_cat) => {
        const auditRef = (_cat.auditRefs || []).find(ref => ref.id === auditId)
        if (auditRef) {
          category = { weight: auditRef.weight ?? 0, category: _cat.id! }
        }
      })
      return category
    }

    const auditData = Object.values(audits)
      .map(audit => defu(audit, findCategoryForAuditId(audit.id!) ?? {}) as (pagespeedonline_v5.Schema$LighthouseAuditResultV5 & { category?: string, weight?: number }))
      .filter(audit => audit.score && audit.score !== 1)
      .map(audit =>
        db.insert(sitePageSpeedInsightScanAudits).values({
          sitePageSpeedInsightScanId: entry[0]!.sitePageSpeedInsightScanId,
          category: audit.category,
          auditId: audit.id!,
          weight: audit.weight,
          score: audit.score ?? 0,
          numericValue: audit.numericValue != null ? String(audit.numericValue) : undefined,
        }),
      )

    await chunkedBatch(auditData, 100)

    const totalScore = Math.round(Object.values(categories).reduce((acc, cat) => acc + (cat.score ?? 0), 0) / 4 * 100)
    const key = `psi${strategy === 'mobile' ? 'Mobile' : 'Desktop'}`
    const scores = Object.fromEntries(Object.entries(categories).map(([, _cat]) => {
      return [`${key}${ucFirst(_cat.id === 'best-practices' ? 'bestPractices' : _cat.id!)}`, (_cat.score ?? 0) * 100]
    })) as Record<string, number>
    const psiPayload = {
      [`${key}Lcp`]: audits['largest-contentful-paint']?.numericValue,
      [`${key}Fcp`]: audits['first-contentful-paint']?.numericValue,
      [`${key}Si`]: audits['speed-index']?.numericValue,
      [`${key}Tbt`]: audits['total-blocking-time']?.numericValue,
      [`${key}Ttfb`]: audits['server-response-time']?.numericValue,
      [`${key}Cls`]: audits['cumulative-layout-shift']?.numericValue,
      [`${key}Score`]: totalScore,
      ...scores,
    }
    await db.insert(sitePathDateAnalytics).values({
      siteId,
      date: format(new Date(), 'yyyy-MM-dd'),
      path,
      ...psiPayload,
    }).onConflictDoUpdate({
      set: psiPayload,
      target: [sitePathDateAnalytics.siteId, sitePathDateAnalytics.date, sitePathDateAnalytics.path],
    })

    // Broadcast
    if (site?.owner) {
      broadcastToUser(site.owner.publicId, {
        name: 'paths/run-psi',
        entityId: siteId,
        entityType: 'site',
        payload: { siteId: site.publicId, path, strategy, totalScore },
      })
    }
  },
})
