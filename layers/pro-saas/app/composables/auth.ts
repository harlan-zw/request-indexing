export function useSession() {
  const { loggedIn, session, fetch } = useUserSession()

  return {
    loggedIn,
    session,
    refresh: fetch,
  }
}

export async function useRequireProSession() {
  const { loggedIn, session, fetch } = useUserSession()
  const nuxtApp = useNuxtApp()
  const route = useRoute()
  await fetch()
  if (!loggedIn.value) {
    // Preserve the deep-link the user was trying to reach so the post-login
    // bounce restores it (Item 9 deep-link flow). Same-origin Pro-dashboard
    // paths only — anything else falls through to the default login URL.
    const target = route.fullPath.startsWith('/pro/dashboard/') && !route.fullPath.startsWith('/login')
      ? `/login?redirect=${encodeURIComponent(route.fullPath)}`
      : '/login'
    await nuxtApp.runWithContext(async () => {
      await navigateTo(target, { replace: true })
    })
  }
  return { loggedIn, session, refresh: fetch }
}
