export default defineNuxtRouteMiddleware(async (to) => {
  if (to.path.startsWith('/dashboard') || to.path.startsWith('/account')) {
    const { loggedIn } = useUserSession()
    if (!loggedIn.value)
      return navigateTo('/get-started')
  }
})
