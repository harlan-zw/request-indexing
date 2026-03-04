import type { SiteSelect } from '#shared/types/database'
import { useAsyncData } from '#imports'
import { createLogoutHandler } from '~/composables/auth'

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
}
