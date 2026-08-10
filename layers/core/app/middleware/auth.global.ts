const AnonymousAllowlistPrefixes = ['/tools', '/login', '/auth', '/get-started']

export default defineNuxtRouteMiddleware((to) => {
  const { loggedIn } = useUserSession()
  if (loggedIn.value && (to.path === '/get-started' || to.path === '/login'))
    return navigateTo('/dashboard')
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
