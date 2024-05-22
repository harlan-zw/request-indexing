import { pagespeedonline } from '@googleapis/pagespeedonline'
import dayjs from 'dayjs'
import type { pagespeedonline_v5 } from '@googleapis/pagespeedonline/v5'
import { withBase } from 'ufo'
import { sitePathDateAnalytics, sites } from '~/server/database/schema'
import { defineJobHandler } from '~/server/plugins/eventServiceProvider'

function ucFirst(s: string) {
  return s.charAt(0).toUpperCase() + s.slice(1)
}

export default defineJobHandler(async (event) => {
  const { siteId, page, strategy } = await readBody<{ siteId: number, page: string, strategy: string }>(event)
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
      eq(sitePathDateAnalytics.path, page),
    ),
  })

  if ((existing?.psiMobileScore && strategy === 'mobile') || (existing?.psiDesktopScore && strategy === 'desktop')) {
    return {
      res: 'Already run',
    }
  }

  const api = pagespeedonline({
    version: 'v5',
    // TODO each oauth provider should have their own token
    auth: useRuntimeConfig().google.pagespeedApiToken,
  })
  const url = withBase(site!.domain!, page)
  const res = await api.pagespeedapi.runpagespeed({
    url,
    category: ['ACCESSIBILITY', 'BEST_PRACTICES', 'PERFORMANCE', 'SEO'],
    strategy,
  })
    .then(res => res.data)
    .catch((err) => {
      return false
    })
  console.log(res)
  if (typeof res === 'boolean') {
    return {
      error: 'Failed to fetch PSI',
    }
  }

  const path = new URL(url).pathname
  await hubBlob().put(`psi:${siteId}:${path}:${strategy}:lighthouse.json`, JSON.stringify(res))
  await hubBlob().put(`psi:${siteId}:${path}:${strategy}:screenshot.png`, res.lighthouseResult.audits['final-screenshot'].details.data)
  const totalScore = Math.round(Object.values(res.lighthouseResult.categories).reduce((acc, cat) => acc + cat.score, 0) / 4 * 100)
  const key = `psi${strategy === 'mobile' ? 'Mobile' : 'Desktop'}`
  const scores = Object.fromEntries(Object.entries(res.lighthouseResult.categories).map(([, cat]) => {
    const _cat = cat as pagespeedonline_v5.Schema$LighthouseCategoryV5
    return [`${key}${ucFirst(_cat.id === 'best-practices' ? 'bestPractices' : _cat.id!)}`, _cat.score * 100]
  })) as Record<string, number>
  const payload = {
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
    broadcastTo: site.owner.publicId,
    siteId: site.publicId,
    path,
    strategy,
    totalScore,
  }
})
