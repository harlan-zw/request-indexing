import { pagespeedonline } from '@googleapis/pagespeedonline'
import dayjs from 'dayjs'
import type { pagespeedonline_v5 } from '@googleapis/pagespeedonline/v5'
import { withBase } from 'ufo'
import { sitePageSpeedInsightScans, sitePathDateAnalytics, sites } from '~/server/database/schema'
import { defineJobHandler } from '~/server/plugins/eventServiceProvider'

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

  const existing = await db.query.sitePathDateAnalytics.findFirst({
    where: and(
      eq(sitePathDateAnalytics.siteId, siteId),
      eq(sitePathDateAnalytics.date, dayjs().format('YYYY-MM-DD')),
      eq(sitePathDateAnalytics.path, path),
    ),
  })

  if ((existing?.psiMobileScore && strategy === 'mobile') || (existing?.psiDesktopScore && strategy === 'desktop')) {
    return {
      res: 'Already run',
    }
  }
  const entry = await db.insert(sitePageSpeedInsightScans).values({
    siteId,
    path,
    strategy,
  }).returning()

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
