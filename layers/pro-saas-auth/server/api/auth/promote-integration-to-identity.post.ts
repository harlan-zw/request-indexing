import { and, eq, ne } from 'drizzle-orm'
import { z } from 'zod'
import { logger } from '~~/shared/server/logger'
import * as schema from '#layers/pro-saas/server/database'
import { useAuthHooks } from '../../utils/auth/hooks'
import { upsertIdentity } from '../../utils/auth/identity'

const Body = z.object({
  provider: z.enum(['google']),
})

interface GoogleUserinfoV3 {
  sub: string
  email: string
  email_verified: boolean
  name?: string
  picture?: string
}

// Promote an existing integration grant (today: Google via GSC) into a
// `user_identities` sign-in row. No second OAuth bounce: we refresh the live
// access token using the stored refresh token, hit userinfo v3, and verify
// `email_verified=true` + `sub` matches what we stored. Conflict-checks
// against any other user's identity rows before inserting.
export default defineEventHandler(async (event) => {
  const session = await requireUserSession(event)
  const userId = session.user.id
  const { provider } = await readValidatedBody(event, Body.parse)
  if (provider !== 'google')
    throw createError({ statusCode: 400, statusMessage: 'Unsupported provider' })

  const db = useDrizzle(event)
  const googleAccount = await db
    .select({
      payload: schema.googleAccounts.payload,
      tokens: schema.googleAccounts.tokens,
    })
    .from(schema.googleAccounts)
    .where(and(eq(schema.googleAccounts.userId, userId), eq(schema.googleAccounts.type, 'auth')))
    .get()

  const gscUserSub = googleAccount?.payload?.sub
  const refreshToken = googleAccount?.tokens?.refresh_token

  if (!gscUserSub || !refreshToken)
    throw createError({ statusCode: 422, statusMessage: 'No Google integration to promote' })

  // Already promoted?
  const existing = await db.query.userIdentities.findFirst({
    where: and(eq(schema.userIdentities.userId, userId), eq(schema.userIdentities.provider, 'google')),
  }).catch(() => null)
  if (existing)
    return { status: 'already_linked' as const }

  // Refresh the access token via Google. We re-mint short-lived access tokens
  // here rather than reusing the stored one (the stored access token may have
  // expired; refresh tokens last longer).
  const config = useRuntimeConfig(event)
  const tokenRes = await $fetch<{ access_token?: string, id_token?: string }>('https://oauth2.googleapis.com/token', {
    method: 'POST',
    body: new URLSearchParams({
      client_id: config.oauth.google.clientId,
      client_secret: config.oauth.google.clientSecret,
      grant_type: 'refresh_token',
      refresh_token: refreshToken,
    }).toString(),
    headers: { 'content-type': 'application/x-www-form-urlencoded' },
  }).catch((err) => {
    logger.error('[promote-google] refresh failed:', err?.data ?? err?.message)
    return null
  })

  if (!tokenRes?.access_token)
    throw createError({ statusCode: 422, statusMessage: 'Re-consent required', data: { reason: 'REAUTH_REQUIRED' } })

  const userinfo = await $fetch<GoogleUserinfoV3>('https://www.googleapis.com/oauth2/v3/userinfo', {
    headers: { Authorization: `Bearer ${tokenRes.access_token}` },
  }).catch((err) => {
    logger.error('[promote-google] userinfo failed:', err?.message)
    return null
  })

  if (!userinfo)
    throw createError({ statusCode: 422, statusMessage: 'Re-consent required', data: { reason: 'REAUTH_REQUIRED' } })
  if (!userinfo.email_verified)
    throw createError({ statusCode: 422, statusMessage: 'Email not verified by Google', data: { reason: 'EMAIL_NOT_VERIFIED' } })
  if (userinfo.sub !== gscUserSub)
    throw createError({ statusCode: 409, statusMessage: 'Google account identifier changed', data: { reason: 'SUB_MISMATCH' } })

  // Conflict: this Google account is already a sign-in for someone else.
  const conflict = await db.query.userIdentities.findFirst({
    where: and(
      eq(schema.userIdentities.provider, 'google'),
      eq(schema.userIdentities.providerUserId, userinfo.sub),
      ne(schema.userIdentities.userId, userId),
    ),
  }).catch(() => null)
  if (conflict)
    throw createError({ statusCode: 409, statusMessage: 'This Google account is linked to a different Nuxt SEO Pro account' })

  const identity = await upsertIdentity(db, {
    userId,
    provider: 'google',
    identity: {
      providerUserId: userinfo.sub,
      email: userinfo.email,
      emailVerified: true,
      name: userinfo.name ?? null,
      avatarUrl: userinfo.picture ?? null,
      allVerifiedEmails: [userinfo.email],
    },
  })

  try {
    await useAuthHooks().callHook('user:identity-linked', {
      event,
      user: { id: userId, apiKey: session.apiKey ?? '', source: null },
      identity,
    })
  }
  catch (err) {
    logger.error('[promote-google] identity-linked hook failed:', err)
  }

  return { status: 'linked' as const }
})
