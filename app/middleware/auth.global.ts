const AuthenticatedRoutePrefixes = ['/dashboard', '/account']

export default defineNuxtRouteMiddleware((to) => {
  const { loggedIn } = useUserSession()
  // TODO redirect to team setup
  // if (session.value?.team && !session.value?.team.onboardedStep && to.path !== '/dashboard/team/setup')
  //   return navigateTo('/dashboard/team/setup')
  if (loggedIn.value && to.path === '/get-started')
    return navigateTo('/dashboard')
  if (AuthenticatedRoutePrefixes.some(p => to.path.startsWith(p))) {
    if (!loggedIn.value)
      return navigateTo('/get-started')
  }
})
