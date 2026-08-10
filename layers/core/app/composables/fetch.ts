import type { SiteSelect } from '#shared/types/database'
import { createLogoutHandler } from '~~/layers/core/app/composables/auth'
import { useAsyncData } from '#imports'

export async function fetchSites() {
  const toast = useToast()
  const { user } = useUserSession()
  const logout = createLogoutHandler()
  const fetchFn = useRequestFetch()
  return useAsyncData<{ sites: SiteSelect[] }>(`sites`, async () => {
    return fetchFn(`/api/sites/list`, {
      query: {
        teamId: user.value?.currentTeamId,
      },
      async onResponseError(res) {
        if ([401].includes(res.response.status)) {
          await logout(true)
          toast.add({
            id: 'unauthorized-error',
            title: 'Oops, looks like session has expired.',
            description: 'Please login again to continue.',
            color: 'error',
          })
        }
        else { toast.add({ id: 'unauthorized-error', title: 'Error fetching sites', description: res.error?.message, color: 'error' }) }
      },
    })
  })
}
