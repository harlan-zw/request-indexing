import { pagespeedonline } from '@googleapis/pagespeedonline'
import dayjs from 'dayjs'
import type { pagespeedonline_v5 } from '@googleapis/pagespeedonline/v5'
import { withBase } from 'ufo'
import { defu } from 'defu'
import {
  siteDateAnalytics,
  sitePageSpeedInsightScanAudits,
  sitePageSpeedInsightScans,
  sitePathDateAnalytics,
  sites,
} from '~/server/database/schema'
import { defineJobHandler } from '~/server/plugins/eventServiceProvider'
import { incrementUsage } from '~/server/app/services/usage'

function ucFirst(s: string) {
  return s.charAt(0).toUpperCase() + s.slice(1)
}

export default defineJobHandler(async (event) => {
  const { siteId, path, strategy } = await readBody<{ siteId: number, path: string, strategy: string }>(event)
  const db = useDrizzle()

  const site = await db.query.sites.findFirst({
    with: {
      owner: {
        with: {
          googleAccounts: true,
        },
      },
    },
    where: eq(sites.siteId, siteId),
  })

  // const existing = await db.query.sitePathDateAnalytics.findFirst({
  //   where: and(
  //     eq(sitePathDateAnalytics.siteId, siteId),
  //     eq(sitePathDateAnalytics.date, dayjs().format('YYYY-MM-DD')),
  //     eq(sitePathDateAnalytics.path, path),
  //   ),
  // })

  // if ((existing?.psiMobileScore && strategy === 'mobile') || (existing?.psiDesktopScore && strategy === 'desktop')) {
  //   return {
  //     res: 'Already run',
  //   }
  // }
  const entry = await db.insert(sitePageSpeedInsightScans).values({
    siteId,
    path,
    strategy,
  }).returning()
  await incrementUsage(site.siteId, 'psi')
  const api = pagespeedonline({
    version: 'v5',
    // TODO each oauth provider should have their own token
    auth: useRuntimeConfig().google.pagespeedApiToken,
  })

  const res = await api.pagespeedapi.runpagespeed({
    url: withBase(path, site!.domain!),
    category: ['ACCESSIBILITY', 'BEST_PRACTICES', 'PERFORMANCE', 'SEO'],
    strategy,
  })
    .then(res => res.data)
    .catch(() => {
      return false
    })
  if (typeof res === 'boolean') {
    return {
      error: 'Failed to fetch PSI',
    }
  }
  // keep track of origin loading experience
  if (res.originLoadingExperience) {
    /**
     * Need to save the data for all these columns, may need to manually map
     *
     * mobileOriginCls75: integer('mobile_origin_cls_75'),
     *   mobileOriginTtfb75: integer('mobile_origin_ttfb_75'),
     *   mobileOriginFcp75: integer('mobile_origin_fcp_75'),
     *   mobileOriginLcp75: integer('mobile_origin_lcp_75'),
     *   mobileOriginFid75: integer('mobile_origin_fid_75'),
     *   mobileOriginInp75: integer('mobile_origin_inp_75'),
     *   // now desktop
     *   desktopOriginCls75: integer('desktop_origin_cls_75'),
     *   desktopOriginTtfb75: integer('desktop_origin_ttfb_75'),
     *   desktopOriginFcp75: integer('desktop_origin_fcp_75'),
     *   desktopOriginLcp75: integer('desktop_origin_lcp_75'),
     *   desktopOriginFid75: integer('desktop_origin_fid_75'),
     */
    const metrics = res.originLoadingExperience.metrics || {}
    const payload: Record<string, any> = {}
    if (metrics.CUMULATIVE_LAYOUT_SHIFT_SCORE) {
      payload[`${strategy}OriginCls75`] = metrics.CUMULATIVE_LAYOUT_SHIFT_SCORE.percentile
    }
    if (metrics.EXPERIMENTAL_TIME_TO_FIRST_BYTE) {
      payload[`${strategy}OriginTtfb75`] = metrics.EXPERIMENTAL_TIME_TO_FIRST_BYTE.percentile
    }
    if (metrics.FIRST_CONTENTFUL_PAINT_MS) {
      payload[`${strategy}OriginFcp75`] = metrics.FIRST_CONTENTFUL_PAINT_MS.percentile
    }
    if (metrics.LARGEST_CONTENTFUL_PAINT_MS) {
      payload[`${strategy}OriginLcp75`] = metrics.LARGEST_CONTENTFUL_PAINT_MS.percentile
    }
    if (metrics.INTERACTION_TO_NEXT_PAINT) {
      payload[`${strategy}OriginInp75`] = metrics.INTERACTION_TO_NEXT_PAINT.percentile
    }
    await db.update(siteDateAnalytics)
      .set({
        [`${strategy}OriginLoadingExperience`]: res.originLoadingExperience,
        ...payload,
      }).where(
        eq(siteDateAnalytics.siteId, siteId),
        and(eq(siteDateAnalytics.date, dayjs().format('YYYY-MM-DD'))),
      )
  }
  if (res.loadingExperience) {
    // save to siteDatePathAnalytics
    const metrics = res.loadingExperience.metrics || {}
    const payload: Record<string, any> = {
      [`${strategy}LoadingExperience`]: res.loadingExperience,
    }
    if (metrics.CUMULATIVE_LAYOUT_SHIFT_SCORE) {
      payload[`${strategy}Cls75`] = metrics.CUMULATIVE_LAYOUT_SHIFT_SCORE.percentile
    }
    if (metrics.EXPERIMENTAL_TIME_TO_FIRST_BYTE) {
      payload[`${strategy}Ttfb75`] = metrics.EXPERIMENTAL_TIME_TO_FIRST_BYTE.percentile
    }
    if (metrics.FIRST_CONTENTFUL_PAINT_MS) {
      payload[`${strategy}Fcp75`] = metrics.FIRST_CONTENTFUL_PAINT_MS.percentile
    }
    if (metrics.LARGEST_CONTENTFUL_PAINT_MS) {
      payload[`${strategy}Lcp75`] = metrics.LARGEST_CONTENTFUL_PAINT_MS.percentile
    }
    if (metrics.INTERACTION_TO_NEXT_PAINT) {
      payload[`${strategy}Inp75`] = metrics.INTERACTION_TO_NEXT_PAINT.percentile
    }
    await db.update(sitePathDateAnalytics)
      .set(payload)
      .where(
        eq(sitePathDateAnalytics.siteId, siteId),
        eq(sitePathDateAnalytics.date, dayjs().format('YYYY-MM-DD')),
        eq(sitePathDateAnalytics.path, path),
      )
  }

  const reportBlob = await hubBlob().put(`psi:${siteId}:${path}:${strategy}:lighthouse.json`, JSON.stringify(res))
  const reportScreenshotBlob = await hubBlob().put(`psi:${siteId}:${path}:${strategy}:screenshot.png`, res.lighthouseResult.audits['final-screenshot'].details.data)

  await db.update(sitePageSpeedInsightScans).set({
    performance: res.lighthouseResult.categories.performance?.score,
    seo: res.lighthouseResult.categories.seo?.score,
    accessibility: res.lighthouseResult.categories.accessibility?.score,
    bestPractices: res.lighthouseResult.categories['best-practices']?.score,
    reportBlob,
    reportScreenshotBlob,
  }).where(eq(sitePageSpeedInsightScans.sitePageSpeedInsightScanId, entry[0].sitePageSpeedInsightScanId))

  function findCategoryForAuditId(auditId: pagespeedonline_v5.Schema$LighthouseAuditResultV5['id']) {
    let category: { weight: number, category: string } = null
    Object.values(res.lighthouseResult.categories).forEach((cat) => {
      const _cat = cat as pagespeedonline_v5.Schema$LighthouseCategoryV5
      const auditRef = _cat.auditRefs.find(ref => ref.id === auditId)
      if (auditRef) {
        category = {
          weight: auditRef.weight,
          category: _cat.id,
        }
      }
    })
    return category
  }

  // iterate over audits, we want to store any that have a score that is set and not 1
  const auditData = Object.values(res.lighthouseResult?.audits)
    .map((audit) => {
      return defu(audit as pagespeedonline_v5.Schema$LighthouseAuditResultV5, findCategoryForAuditId(audit.id))
    })
    .filter(audit => audit.score && audit.score !== 1)
    .map((audit) => {
      // sitePageSpeedInsightScanAudits
      return db.insert(sitePageSpeedInsightScanAudits).values({
        sitePageSpeedInsightScanId: entry[0].sitePageSpeedInsightScanId,
        category: audit.category,
        auditId: audit.id,
        weight: audit.weight,
        score: audit.score,
        numericValue: audit.numericValue,
      })
    })

  await chunkedBatch(auditData, 100)

  const totalScore = Math.round(Object.values(res.lighthouseResult.categories).reduce((acc, cat) => acc + cat.score, 0) / 4 * 100)
  const key = `psi${strategy === 'mobile' ? 'Mobile' : 'Desktop'}`
  const scores = Object.fromEntries(Object.entries(res.lighthouseResult.categories).map(([, cat]) => {
    const _cat = cat as pagespeedonline_v5.Schema$LighthouseCategoryV5
    return [`${key}${ucFirst(_cat.id === 'best-practices' ? 'bestPractices' : _cat.id!)}`, _cat.score * 100]
  })) as Record<string, number>
  const payload = {
    [`${key}Lcp`]: res.lighthouseResult.audits['largest-contentful-paint']?.numericValue,
    [`${key}Fcp`]: res.lighthouseResult.audits['first-contentful-paint']?.numericValue,
    [`${key}Si`]: res.lighthouseResult.audits['speed-index']?.numericValue,
    [`${key}Tbt`]: res.lighthouseResult.audits['total-blocking-time']?.numericValue,
    [`${key}Ttfb`]: res.lighthouseResult.audits['server-response-time']?.numericValue,
    [`${key}Cls`]: res.lighthouseResult.audits['cumulative-layout-shift']?.numericValue,
    [`${key}Score`]: totalScore,
    ...scores,
  }
  // insert into site date analytics
  await db.insert(sitePathDateAnalytics).values({
    siteId,
    date: dayjs().format('YYYY-MM-DD'), // gcs format
    path,
    ...payload,
  }).onConflictDoUpdate({
    set: payload,
    target: [sitePathDateAnalytics.siteId, sitePathDateAnalytics.date, sitePathDateAnalytics.path],
  })

  return {
    broadcastTo: site!.owner!.publicId,
    siteId: site!.publicId,
    path,
    strategy,
    totalScore,
  }
})
