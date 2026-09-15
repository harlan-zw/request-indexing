import { useProGscStatus } from '#layers/pro-gsc/app/composables/useProGscStatus'

/**
 * Site context for every `/pro/dashboard/sites/:id` page. The route param is
 * the site's `s_` public id; `/api/pro/sites/:id` resolves it and returns the
 * fields the pages read.
 */
interface SiteShape {
  id?: string
  publicId?: string
  url?: string
  name?: string | null
  domain?: string | null
  property?: string
  gscdumpSiteId?: string | null
  gscdumpSiteUrl?: string | null
}

export function useSite(pageTitle?: string) {
  const route = useRoute()
  const siteId = computed(() => route.params.id as string)

  const proFetch = useProFetch()
  const { data: site, status: siteStatus } = useAsyncData<SiteShape | null>(
    () => `pro-saas:site:${siteId.value}`,
    () => proFetch<{ site: SiteShape }>(`/api/pro/sites/${siteId.value}`).then(r => r.site).catch(() => null),
    { watch: [siteId] },
  )

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
    siteStatus,
    gscdumpSiteId,
    siteName,
    isNotConnected,
    isReady,
    isProcessing,
    gscData,
  }
}
