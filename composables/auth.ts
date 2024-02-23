import type { ComputedRef } from 'vue'
import type { User } from '~/types'

export function useAuthenticatedUser() {
  const { loggedIn, user } = useUserSession()
  if (!loggedIn) {
    throw createError({
      statusCode: 401,
      message: 'Unauthorized',
    })
  }
  return user as ComputedRef<User>
}

export function createSessionReloader() {
  const { session } = useUserSession()
  return async () => {
    session.value = await $fetch('/api/_auth/session')
  }
}

// work around nuxt-auth-utils async context bug
export function createLogoutHandler() {
  const { session } = useUserSession()
  const toast = useToast()

  const nextTickFn = nextTick
  return async (force?: boolean) => {
    if (!force) {
      toast.add({ id: 'logout', title: 'See you next time!', description: 'You have logged out of the site.', color: 'green' })
      await navigateTo('/')
    }
    else {
      await navigateTo('/get-started')
    }
    await nextTickFn(() => {
      // can't access clear API here
      $fetch('/api/_auth/session', { method: 'DELETE' })
        .finally(() => {
          session.value = { user: null }
        })
    })
  }
}
