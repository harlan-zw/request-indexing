import { useProGscStatus } from '#layers/pro-gsc/app/composables/useProGscStatus'
import { useSiteResource } from './useSiteResource'

/**
 * Site context for every `/pro/dashboard/sites/:id` page. The route param is
 * the site's `s_` public id; `/api/pro/sites/:id` resolves it and returns the
 * fields the pages read.
 *
 * `site` is null only while the lookup is in flight or when the read failed.
 * An id that names nothing never reaches a page: `pro-site.global.ts` answers
 * 404 for it first.
 */
export function useSite(pageTitle?: string) {
  const route = useRoute()
  const siteId = computed(() => route.params.id as string)

  const { lookup, site, status: siteStatus } = useSiteResource(siteId)

  const gscdumpSiteId = computed(() => site.value?.gscdumpSiteId)

  const siteName = computed(() => {
    if (!site.value?.url)
      return 'Site'
    try {
      const url = site.value.url.startsWith('http') ? site.value.url : `https://${site.value.url}`
      return site.value.name || new URL(url).hostname
    }
    catch {
      return site.value.name || site.value.url
    }
  })

  const { isNotConnected, isReady, isProcessing, data: gscData } = useProGscStatus(siteId)

  if (pageTitle) {
    useSeoMeta({ title: () => `${pageTitle} - ${siteName.value}` })
  }

  return {
    siteId,
    site,
    siteLookup: lookup,
    siteStatus,
    gscdumpSiteId,
    siteName,
    isNotConnected,
    isReady,
    isProcessing,
    gscData,
  }
}
