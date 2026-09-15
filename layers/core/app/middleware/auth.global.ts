const AnonymousAllowlistPrefixes = ['/tools', '/login', '/auth', '/pro/onboarding']

export default defineNuxtRouteMiddleware((to) => {
  const { loggedIn } = useUserSession()
  // `/pro/onboarding` is deliberately absent here. It resolves its own landing
  // for a signed-in visitor, so it resumes the wizard at the right step instead
  // of being bounced to the dashboard.
  if (loggedIn.value && to.path === '/login')
    return navigateTo('/pro/dashboard')
  if (AnonymousAllowlistPrefixes.some(p => to.path === p || to.path.startsWith(`${p}/`)))
    return
  if (!requiresAuthentication(to.path) || loggedIn.value)
    return

  if (to.path === '/pro/dashboard' || to.path.startsWith('/pro/dashboard/')) {
    return navigateTo({
      path: '/login',
      query: { redirect: to.fullPath },
    })
  }

  return navigateTo('/login')
})
