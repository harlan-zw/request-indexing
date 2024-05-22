import { defu } from 'defu'
import type { FetchOptions } from 'ofetch'
import type { searchconsole_v1 } from '@googleapis/searchconsole/v1'
import { createLogoutHandler } from '~/composables/auth'
import { useAsyncData } from '#imports'
import type { type SiteDateAnalyticsSelect, type SiteSelect, SiteUrlDateAnalyticsSelect } from '~/server/database/schema'
import type {Ref} from "@vue/reactivity";

export function useSiteData(site: SiteSelect) {
  const { user } = useUserSession()
  const factory = <T>(path: string, fetchOptions?: FetchOptions<any>) => sharedAsyncData<T>(`sites:${site.siteId}:${path}`, async () => {
    return $fetch<T>(`/api/sites/${site.siteId}/${path}`, defu(fetchOptions, {
      query: {
        teamId: user.value?.teamId,
      },
    }))
  }, {
    // watch: [() => user.value?.analyticsPeriod],
  })

  return {
    keywordResearch: () => factory<{ keyword: string, volume: number, cpc: number, competition: number }[]>('ads/keyword-history', { method: 'POST' }),
    psiRun: () => factory<{ page: string, data: any }>('psi/run', { method: 'POST' }),
    psiDates: () => factory<SiteUrlDateAnalyticsSelect[]>('psi/dates'),
    crux: () => factory<{ dates: number[], cls: { value: number, time: number }[], inp: { value: number, time: number }[], lcp: { value: number, time: number }[] }>('crux/origin'),
    indexing: () => factory<{ nonIndexedUrls: Set<string> }>('alt/indexing'),
    dateAnalytics: () => factory<{ period: SiteDateAnalyticsSelect, prevPeriod: SiteDateAnalyticsSelect, dates: SiteDateAnalyticsSelect[] }>('alt/date-analytics'),
    keywords: () => factory<{ periodCount: number, prevPeriodCount: number, rows: { keyword: string, clicks: number, impressions: number }[] }>('gsc/keywords'),
    keywordsDb: () => factory<{ periodCount: number, prevPeriodCount: number, rows: { keyword: string, clicks: number, impressions: number }[] }>('keywords'),
    pages: (options?: { query: { limit?: number } }) => factory<{ periodCount: number, prevPeriodCount: number, rows: { page: string, clicks: number, impressions: number }[] }>('gsc/pages', options),
    dates: () => factory<{ startDate?: string, endDate?: string, rows: (Omit<searchconsole_v1.Schema$ApiDataRow, 'keys'> & { date: string })[] }>('gsc/dates'),
    analytics: () => factory<{ period: { clicks: number, impressions: number }, prevPeriod: { clicks: number, impressions: number } }>('gsc/analytics'),
    devices: () => factory<{ period: { device: string, clicks: number, impressions: number }, prevPeriod: { device: string, clicks: number, impressions: number } }>('gsc/devices'),
    countries: () => factory<{ period: { country: string, clicks: number, impressions: number }, prevPeriod: { country: string, clicks: number, impressions: number } }>('gsc/countries'),
  }
}

export function sharedAsyncData<T>(key: string, _handler: () => Promise<T>, options?: { watch: any[], allowServer?: boolean }): { data: Ref<T | undefined>, refresh: () => void, pending: Ref<boolean>, status: Ref<'pending' | 'success' | 'error'> } {
  // need to copy some logic from asyncData
  const nuxt = useNuxtApp()

  // client only
  if (!options?.allowServer && import.meta.server) {
    return {
      data: shallowRef(null),
      pending: true,
      status: 'pending',
    }
  }

  if (nuxt._asyncData[key]) {
    const promise = nuxt._asyncDataPromises[key]
    promise.data = nuxt._asyncData[key]!.data
    promise.pending = nuxt._asyncData[key]!.pending
    promise.status = nuxt._asyncData[key]!.status
    return promise
  }

  nuxt._asyncData[key] = {
    data: shallowRef(undefined),
    pending: ref(true),
    error: toRef(nuxt.payload._errors, key),
    status: ref('pending'),
  }

  nuxt._asyncDataPromises[key] = nuxt.runWithContext(_handler).then((res) => {
    nuxt._asyncData[key]!.data.value = res
    nuxt._asyncData[key]!.pending.value = false
    nuxt._asyncData[key]!.status.value = 'success'
    return nuxt._asyncData[key]!
  })

  function refresh() {
    nuxt._asyncData[key]!.data.value = undefined
    nuxt._asyncData[key]!.pending.value = true
    nuxt._asyncData[key]!.status.value = 'pending'
    nuxt._asyncDataPromises[key] = nuxt.runWithContext(_handler).then((res) => {
      nuxt._asyncData[key]!.data.value = res
      nuxt._asyncData[key]!.pending.value = false
      nuxt._asyncData[key]!.status.value = 'success'
      return nuxt._asyncData[key]!
    })
  }

  if (options?.watch) {
    watch(options.watch, () => {
      refresh()
    })
  }

  const res = nuxt._asyncDataPromises[key]!
  res.data = nuxt._asyncData[key]!.data
  res.pending = nuxt._asyncData[key]!.pending
  res.status = nuxt._asyncData[key]!.status
  res.refresh = refresh
  return res
}

export async function fetchSite(site: GoogleSearchConsoleSite, scope?: 'mock' | 'full' | 'partial') {
  const toast = useToast()
  const logout = createLogoutHandler()
  const force = ref()
  const fetchFn = useRequestFetch()
  const siteId = site.domain || site.siteUrl
  const res = await useAsyncData(
    // avoid sharing payload key
    `sites:${siteId}`,
    async () => await fetchFn(`/api/sites/${encodeURIComponent(siteId)}`, {
      query: { force: force.value, scope },
      onResponseError: async ({ response }) => {
        if (response.status === 401) {
          // make sure we have context
          await logout(true)
          toast.add({
            id: 'unauthorized-error',
            title: 'Oops, looks like session has expired.',
            description: 'Please login again to continue.',
            color: 'red',
          })
        }
        else {
          toast.add({
            id: `sites:${site.siteUrl}:error`,
            title: `Failed to fetch ${site.siteUrl}`,
            description: response.statusText,
            color: 'red',
          })
        }
      },
    }),
    {
      server: false,
      deep: false,
      immediate: scope !== 'mock',
    },
  )
  return {
    ...res,
    async fetchPages() {

    },
    async forceRefresh() {
      return callFnSyncToggleRef(res.refresh, force)
    },
  }
}

export async function fetchSites() {
  const toast = useToast()
  const { user } = useUserSession()
  const logout = createLogoutHandler()
  const fetchFn = useRequestFetch()
  return useAsyncData<{ sites: SiteSelect[] }>(`sites`, async () => {
    return fetchFn(`/api/sites/list`, {
      query: {
        teamId: user.value?.teamId,
      },
      async onResponseError(res) {
        if ([401].includes(res.response.status)) {
          // make sure we have context
          await logout(true)
          toast.add({
            id: 'unauthorized-error',
            title: 'Oops, looks like session has expired.',
            description: 'Please login again to continue.',
            color: 'red',
          })
        }
        else { toast.add({ id: 'unauthorized-error', title: 'Error fetching sites', description: res.error?.message, color: 'red' }) }
      },
    })
  })
  // return Object.assign(res, {
  //   forceRefresh() {
  //     force.value = true
  //     res.refresh().then(() => {
  //       force.value = false
  //     })
  //   },
  // })
}
