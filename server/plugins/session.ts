import { sessions } from '~/server/database/schema'

export default defineNitroPlugin(() => {
  // Called when the session is fetched during SSR for the Vue composable (/api/_auth/session)
  // Or when we call useUserSession().fetch()
  sessionHooks.hook('fetch', async (session) => {
    // extend User Session by calling your database
    // or
    // throw createError({ ... }) if session is invalid for example
    // console.log('fetch session', session)
    const _session = await useDrizzle().query.sessions.findFirst({
      where: eq(sessions.sessionId, session.sessionId),
      with: {
        user: true,
      },
    })
    if (!_session) {
      throw createError({
        statusCode: 404,
        message: 'Session not found',
      })
    }
    // console.log(_session)
    const { user } = _session
    session.user = {
      name: user.name,
      userId: user.publicId,
      email: user.email,
      picture: user.avatar,
      analyticsPeriod: user.analyticsPeriod || '30d',
      analyticsRange: user.analyticsRange,
    }
  })

  // Called when we call useServerSession().clear() or clearUserSession(event)
  sessionHooks.hook('clear', async (session) => {
    // Log that user logged out
    useDrizzle().delete(sessions).where(eq(sessions.sessionId, session.sessionId))
  })
})
