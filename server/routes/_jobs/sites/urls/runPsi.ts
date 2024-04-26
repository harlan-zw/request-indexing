import { pagespeedonline } from '@googleapis/pagespeedonline'
import { siteUrls } from '~/server/database/schema'
import { defineJobHandler } from '~/server/plugins/eventServiceProvider'

export default defineJobHandler(async (event) => {
  const { siteId, page, strategy } = await readBody<{ siteId: number, page: string, strategy: string }>(event)

  const api = pagespeedonline('v5', {
    auth: useRuntimeConfig().google.pagespeedApiToken,
  })
  const res = await api.pagespeedapi.runpagespeed({
    url: page,
    category: ['ACCESSIBILITY', 'BEST_PRACTICES', 'PERFORMANCE', 'SEO'],
    strategy,
  })
    .then(res => res.data)
    .catch(() => false)
  if (!res)
    return

  const path = new URL(page).pathname

  const db = useDrizzle()
  // TODO use different storage for payload
  if (strategy === 'mobile') {
    await db.update(siteUrls).set({
      psiMobileScore: Object.values(res.lighthouseResult.categories).reduce((acc, cat) => acc + cat.score, 0) / 4,
    }).where(and(eq(siteUrls.siteId, siteId), eq(siteUrls.path, path)))
  }
  else if (strategy === 'desktop') {
    await db.update(siteUrls).set({
      psiDesktopScore: Object.values(res.lighthouseResult.categories).reduce((acc, cat) => acc + cat.score, 0) / 4,
    }).where(and(eq(siteUrls.siteId, siteId), eq(siteUrls.path, path)))
  }
  await hubBlob().put(`psi:${siteId}:${path}:${strategy}:lighthouse.json`, JSON.stringify(res))
  await hubBlob().put(`psi:${siteId}:${path}:${strategy}:screenshot.png`, res.lighthouseResult.audits['final-screenshot'].details.data)
})
