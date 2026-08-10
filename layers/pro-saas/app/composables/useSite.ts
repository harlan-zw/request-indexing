import { useProGscStatus } from '#layers/pro-gsc/app/composables/useProGscStatus'

/**
 * Site context composable. The original `useProSiteInjection`-based version
 * was removed when the `/pro/dashboard/*` route family + layout injections
 * were deleted; this is a minimal V1-shaped stand-in that consumers can
 * keep calling until the canonical site-context composable lands.
 *
 * TODO(pro-saas-cleanup): replace with the V1 site context composable once
 * `apps/app/pages/dashboard/site/[slug]` defines its own injection shape.
 */
interface SiteShape {
  id?: string
  url?: string
  name?: string | null
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
