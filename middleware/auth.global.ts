const AuthenticatedRoutePrefixes = ['/dashboard', '/account']
const AdminRoutePrefixes = ['/admin']

export default defineNuxtRouteMiddleware((to) => {
  const { loggedIn, user } = useUserSession()
  if (AuthenticatedRoutePrefixes.some(p => to.path.startsWith(p))) {
    if (!loggedIn.value)
      return navigateTo('/get-started')
  }
  if (AdminRoutePrefixes.some(p => to.path.startsWith(p))) {
    // TODO refactor this out to use env
    if (!loggedIn.value || user.value?.email !== 'harlan@harlanzw.com')
      return navigateTo('/dashboard')
  }
})
