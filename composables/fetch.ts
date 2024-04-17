import type { NitroFetchOptions } from 'nitropack'
import { createLogoutHandler } from '~/composables/auth'
import type { GoogleSearchConsoleSite } from '~/types'
import { useAsyncData } from '#imports'

export function useSiteData(site: GoogleSearchConsoleSite) {
  const { user } = useUserSession()
  const factory = <T>(path: string, fetchOptions?: NitroFetchOptions<any>) => clientSharedAsyncData<T>(`sites:${site.domain}:${path}`, async () => {
    return $fetch(`/api/sites/${site.siteId}/${path}`, fetchOptions)
  }, {
    watch: [() => user.value?.analyticsPeriod],
  })
  return {
    keywordResearch: () => factory<{ keyword: string, volume: number, cpc: number, competition: number }[]>('ads/keyword-history', { method: 'POST' }),
    psiRun: () => factory<{ page: string, data: any }>('psi/run', { method: 'POST' }),
    crux: () => factory<{ dates: number[], cls: { value: number, time: number }[], inp: { value: number, time: number }[], lcp: { value: number, time: number }[] }>('crux/origin'),
    indexing: () => factory<{ nonIndexedUrls: Set<string> }>('gsc/indexing'),
    keywords: () => factory<{ periodCount: number, prevPeriodCount: number, rows: { keyword: string, clicks: number, impressions: number }[] }>('gsc/keywords'),
    pages: () => factory<{ periodCount: number, prevPeriodCount: number, rows: { page: string, clicks: number, impressions: number }[] }>('gsc/pages'),
    dates: () => factory<{ rows: { date: string, clicks: number, impressions: number }[], startDate: number, endDate: number }>('gsc/dates'),
    analytics: () => factory<{ period: { clicks: number, impressions: number }, prevPeriod: { clicks: number, impressions: number } }>('gsc/analytics'),
    devices: () => factory<{ period: { device: string, clicks: number, impressions: number }, prevPeriod: { device: string, clicks: number, impressions: number } }>('gsc/devices'),
    countries: () => factory<{ period: { country: string, clicks: number, impressions: number }, prevPeriod: { country: string, clicks: number, impressions: number } }>('gsc/countries'),
  }
}

export function clientSharedAsyncData(key: string, _handler: () => Promise<any>, options?: { watch: any[] }) {
  // need to copy some logic from asyncData
  const nuxt = useNuxtApp()

  // client only
  if (import.meta.server) {
    return {
      data: null,
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

export async function fetchSites(scope: 'all' | 'selected' = 'selected') {
  const force = ref()
  const toast = useToast()
  const logout = createLogoutHandler()
  const fetchFn = useRequestFetch()
  const res = useAsyncData(
    `sites:${scope}`,
    async () => await fetchFn('/api/sites/list', {
      query: { force: force.value, scope },
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
    }),
    {
      // server: true,
      deep: false,
    },
  )
  return Object.assign(res, {
    forceRefresh() {
      force.value = true
      res.refresh().then(() => {
        force.value = false
      })
    },
  })
}
