import type { H3Event } from 'h3'
import type { UserSelect } from '~~/layers/core/server/db/schema'
import { withBase, withHttps } from 'ufo'
import { requireEventSite } from '~~/layers/core/server/app/services/util'

async function runPsi(url: string) {
  const { pagespeedonline } = await import('@googleapis/pagespeedonline')
  const api = pagespeedonline({
    version: 'v5',
    auth: useRuntimeConfig().google.cruxApiToken,
  })
  return api.pagespeedapi.runpagespeed({
    url,
    category: ['ACCESSIBILITY', 'BEST_PRACTICES', 'PERFORMANCE', 'SEO'],
    strategy: 'mobile',
  }).then(res => res.data)
}

export async function createPsiClientFromEvent(event: H3Event, user: UserSelect) {
  const { site } = await requireEventSite(event, user)
  return {
    run: (page: string) => runPsi(withBase(page, withHttps(site.domain!))),
  }
}
