import type { H3Event } from 'h3'
import { pagespeedonline } from '@googleapis/pagespeedonline'
import { withBase, withHttps } from 'ufo'
import { requireEventSite } from '~/server/app/services/util'

function runPsi(url: string) {
  const api = pagespeedonline({
    version: 'v5',
    auth: useRuntimeConfig().google.pagespeedApiToken,
  })
  return api.pagespeedapi.runpagespeed({
    url,
    category: ['ACCESSIBILITY', 'BEST_PRACTICES', 'PERFORMANCE', 'SEO'],
    strategy: 'mobile',
  }).then(res => res.data)
}

export async function createPsiClientFromEvent(event: H3Event) {
  const site = await requireEventSite(event)
  return {
    run: (page: string) => runPsi(withBase(page, withHttps(site.domain))),
  }
}
