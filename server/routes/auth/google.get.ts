import { googleAuthEventHandler } from '~/server/app/utils/auth'
import { createGoogleOAuthClient } from '~/server/app/services/gsc'
import type { TeamModel } from '~/server/app/models/Team'
import { sessions, teamUser, teams, users } from '~/server/database/schema'

export default googleAuthEventHandler({
  config: {
    redirectUrl: '/auth/google',
    scope: [
      'https://www.googleapis.com/auth/userinfo.profile',
      'https://www.googleapis.com/auth/userinfo.email',
      'https://www.googleapis.com/auth/webmasters.readonly',
    ],
    authorizationParams: {
      prompt: 'consent',
      access_type: 'offline',
    },
  },
  async onSuccess(event, payload) {
    const { tokens, user: oauth } = payload
    // use the google services to see what scopes the user has
    const client = createGoogleOAuthClient(tokens)
    const tokenInfo = await client.getTokenInfo(tokens.access_token)
    if (!tokenInfo.scopes.includes('https://www.googleapis.com/auth/webmasters.readonly')) {
      await setUserSession(event, {
        authError: 'missing-scope',
      })
      return sendRedirect(event, '/get-started?error=missing-scope')
    }

    const db = useDrizzle()
    // sub is an openid claim that is unique to the user, we don't want to expose this to the client
    let user = await db.query.users.findFirst({
      where: eq(users.sub, oauth.sub),
    })
    let currentTeam: TeamModel
    if (!user) {
      currentTeam = (await db.insert(teams)
        .values({
          personalTeam: true,
          name: `${oauth.given_name}'s Personal Team`,
        }).returning())[0]!
      user = (await db.insert(users)
        .values({
          name: oauth.name,
          avatar: oauth.picture,
          sub: oauth.sub,
          email: oauth.email,
          lastLogin: Date.now(),
          loginTokens: tokens,
          authPayload: oauth,
          currentTeamId: currentTeam.teamId,
        })
        .returning())[0]!
      await db.insert(teamUser).values({
        teamId: currentTeam.teamId,
        userId: user.userId,
        role: 'owner',
      })

      const nitro = useNitroApp()
      await nitro.hooks.callHook('app:user:created', { userId: user.userId })
    }
    else {
      user = (await db.update(users)
        .set({
          lastLogin: Date.now(),
          loginTokens: tokens,
          authPayload: oauth,
        })
        .where(eq(users.sub, oauth.sub))
        .returning())![0]
      currentTeam = await db.query.teams.findFirst({
        where: eq(teams.teamId, user.currentTeamId),
      })
    }

    // create a new session
    const session = (await db
      .insert(sessions)
      .values({
        userId: user.userId,
        ipAddress: getRequestIP(event, { xForwardedFor: true }),
        userAgent: getHeader(event, 'user-agent'),
        lastActivity: Date.now(),
      }).onConflictDoUpdate({
        target: [sessions.userId, sessions.ipAddress, sessions.userAgent],
        set: { lastActivity: Date.now() },
      })
      .returning()
    )[0]

    await setUserSession(event, {
      // we can force expire the session using this id record
      sessionId: session.sessionId,
      // public data only!
      team: {
        onboardedStep: currentTeam.onboardedStep,
        name: currentTeam.name,
      },
      user: {
        name: user.name,
        userId: user.publicId,
        email: user.email,
        picture: user.avatar,
        analyticsPeriod: '30d',
      },
    })

    return sendRedirect(event, currentTeam.onboardedStep !== 'sites-and-backup' ? '/dashboard/team/setup' : '/dashboard')
  },
  // Optional, will return a json error and 401 status code by default
  onError(event, error) {
    console.error('Google OAuth error:', error)
    return sendRedirect(event, '/')
  },
})
