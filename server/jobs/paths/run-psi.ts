import type { pagespeedonline_v5 } from '@googleapis/pagespeedonline/v5'
import dayjs from 'dayjs'
import { defu } from 'defu'
import { withBase } from 'ufo'
import { incrementUsage } from '~/server/app/services/usage'
import {
  siteDateAnalytics,
  sitePageSpeedInsightScanAudits,
  sitePageSpeedInsightScans,
  sitePathDateAnalytics,
  sites,
} from '~/server/db/schema'
import { chunkedBatch } from '~/server/utils/drizzle'
import { broadcastToUser } from '~/server/utils/event-service'
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
        owner: {
          with: { googleAccounts: true },
        },
      },
      where: eq(sites.siteId, siteId),
    })

    const entry = await db.insert(sitePageSpeedInsightScans).values({
      siteId,
      path,
      strategy,
    }).returning()

    await incrementUsage(site!.siteId, 'psi')
    const { pagespeedonline } = await import('@googleapis/pagespeedonline')
    const api = pagespeedonline({
      version: 'v5',
      auth: useRuntimeConfig().google.pagespeedApiToken,
    })

    const res = await api.pagespeedapi.runpagespeed({
      url: withBase(path, site!.domain!),
      category: ['ACCESSIBILITY', 'BEST_PRACTICES', 'PERFORMANCE', 'SEO'],
      strategy,
    })
      .then(res => res.data)
      .catch(() => false as const)

    if (res === false)
      return

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
        .where(
          eq(siteDateAnalytics.siteId, siteId),
          and(eq(siteDateAnalytics.date, dayjs().format('YYYY-MM-DD'))),
        )
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
        .where(
          eq(sitePathDateAnalytics.siteId, siteId),
          eq(sitePathDateAnalytics.date, dayjs().format('YYYY-MM-DD')),
          eq(sitePathDateAnalytics.path, path),
        )
    }

    // Store blob reports
    const reportBlob = await useBlob().put(`psi:${siteId}:${path}:${strategy}:lighthouse.json`, JSON.stringify(res), { contentType: 'application/json' })
    const reportScreenshotBlob = await useBlob().put(`psi:${siteId}:${path}:${strategy}:screenshot.png`, res.lighthouseResult.audits['final-screenshot'].details.data, { contentType: 'image/png' })

    await db.update(sitePageSpeedInsightScans).set({
      performance: res.lighthouseResult.categories.performance?.score,
      seo: res.lighthouseResult.categories.seo?.score,
      accessibility: res.lighthouseResult.categories.accessibility?.score,
      bestPractices: res.lighthouseResult.categories['best-practices']?.score,
      reportBlob,
      reportScreenshotBlob,
    }).where(eq(sitePageSpeedInsightScans.sitePageSpeedInsightScanId, entry[0].sitePageSpeedInsightScanId))

    function findCategoryForAuditId(auditId: string) {
      let category: { weight: number, category: string } | null = null
      Object.values(res.lighthouseResult.categories).forEach((cat) => {
        const _cat = cat as pagespeedonline_v5.Schema$LighthouseCategoryV5
        const auditRef = _cat.auditRefs.find(ref => ref.id === auditId)
        if (auditRef) {
          category = { weight: auditRef.weight, category: _cat.id! }
        }
      })
      return category
    }

    const auditData = Object.values(res.lighthouseResult?.audits)
      .map(audit => defu(audit as pagespeedonline_v5.Schema$LighthouseAuditResultV5, findCategoryForAuditId(audit.id)))
      .filter(audit => audit.score && audit.score !== 1)
      .map(audit =>
        db.insert(sitePageSpeedInsightScanAudits).values({
          sitePageSpeedInsightScanId: entry[0].sitePageSpeedInsightScanId,
          category: audit.category,
          auditId: audit.id,
          weight: audit.weight,
          score: audit.score,
          numericValue: audit.numericValue,
        }),
      )

    await chunkedBatch(auditData, 100)

    const totalScore = Math.round(Object.values(res.lighthouseResult.categories).reduce((acc, cat) => acc + cat.score, 0) / 4 * 100)
    const key = `psi${strategy === 'mobile' ? 'Mobile' : 'Desktop'}`
    const scores = Object.fromEntries(Object.entries(res.lighthouseResult.categories).map(([, cat]) => {
      const _cat = cat as pagespeedonline_v5.Schema$LighthouseCategoryV5
      return [`${key}${ucFirst(_cat.id === 'best-practices' ? 'bestPractices' : _cat.id!)}`, _cat.score * 100]
    })) as Record<string, number>
    const psiPayload = {
      [`${key}Lcp`]: res.lighthouseResult.audits['largest-contentful-paint']?.numericValue,
      [`${key}Fcp`]: res.lighthouseResult.audits['first-contentful-paint']?.numericValue,
      [`${key}Si`]: res.lighthouseResult.audits['speed-index']?.numericValue,
      [`${key}Tbt`]: res.lighthouseResult.audits['total-blocking-time']?.numericValue,
      [`${key}Ttfb`]: res.lighthouseResult.audits['server-response-time']?.numericValue,
      [`${key}Cls`]: res.lighthouseResult.audits['cumulative-layout-shift']?.numericValue,
      [`${key}Score`]: totalScore,
      ...scores,
    }
    await db.insert(sitePathDateAnalytics).values({
      siteId,
      date: dayjs().format('YYYY-MM-DD'),
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
