const ADMIN_EMAILS = ['harlan@harlanzw.com']

export async function requireAdminSession() {
  const { loggedIn, user, session } = useUserSession()

  const isAdmin = computed(() =>
    loggedIn.value && ADMIN_EMAILS.includes(user.value?.email),
  )

  return { loggedIn, user, session, isAdmin }
}
