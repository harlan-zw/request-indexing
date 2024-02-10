import { createLogoutHandler } from '~/composables/auth'
import type { GoogleSearchConsoleSite } from '~/types'
import { useAsyncData } from '#imports'

export async function fetchSite(site: GoogleSearchConsoleSite, isMock?: boolean) {
  const toast = useToast()
  const logout = createLogoutHandler()
  const force = ref()
  const fetchFn = useRequestFetch()
  const res = await useAsyncData(
    `sites:${site.siteUrl}`,
    async () => await fetchFn(`/api/sites/${encodeURIComponent(site.siteUrl)}`, {
      query: { force: force.value },
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
      immediate: !isMock,
    },
  )
  return {
    ...res,
    async forceRefresh() {
      return callFnSyncToggleRef(res.refresh, force)
    },
  }
}

export async function fetchSites() {
  const force = ref()
  const toast = useToast()
  const logout = createLogoutHandler()
  const fetchFn = useRequestFetch()
  const res = await useAsyncData(
    `sites`,
    async () => await fetchFn('/api/sites/list', {
      query: { force: force.value },
      async onResponseError(res) {
        if (res.response.status === 401) {
          // make sure we have context
          await logout(true)
          toast.add({
            id: 'unauthorized-error',
            title: 'Oops, looks like session has expired.',
            description: 'Please login again to continue.',
            color: 'red',
          })
        }
        else { toast.add({ id: 'unauthorized-error', title: 'Error fetching sites', description: res.error.message, color: 'red' }) }
      },
    }),
    {
      server: true,
      deep: false,
    },
  )
  return {
    ...res,
    forceRefresh() {
      force.value = true
      res.refresh().then(() => {
        force.value = false
      })
    },
  }
}
