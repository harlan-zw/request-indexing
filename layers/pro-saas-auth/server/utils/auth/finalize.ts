import type { H3Event } from 'h3'
import type { AuthProviderId, NormalizedIdentity } from '../../../shared/types/auth'
import { eq } from 'drizzle-orm'
import { customAlphabet } from 'nanoid'
import { logger } from '~~/shared/server/logger'
import * as schema from '#layers/pro-saas/server/database'
import { createUserWithPersonalTeam } from '#layers/pro-saas/server/utils/create-user-with-personal-team'
import { safeAuthRedirect } from '../../../shared/utils/auth-redirect'
import { useAuthHooks } from './hooks'
import { attachIdentityToUser, resolveExistingUser, upsertIdentity } from './identity'
import { setAuthSession } from './session'

const { users } = schema

const apiKeyAlphabet = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ'
const generateApiKey = customAlphabet(apiKeyAlphabet, 40)

const AUTH_SOURCE_VALUES = ['pro-free', 'pro-trial', 'purchase-onboarding', 'purchase-wizard'] as const
type AuthSource = typeof AUTH_SOURCE_VALUES[number]
function readAuthSource(event: H3Event): AuthSource | null {
  const raw = getCookie(event, 'auth-source')
  return (AUTH_SOURCE_VALUES as readonly string[]).includes(raw ?? '') ? raw as AuthSource : null
}

export interface SignInOrCreateOpts {
  event: H3Event
  provider: AuthProviderId
  identity: NormalizedIdentity
}

export async function signInOrCreate({ event, provider, identity }: SignInOrCreateOpts) {
  const db = useDrizzle(event)
  const source = readAuthSource(event)
  const isPurchaseOnboarding = source === 'purchase-onboarding' || source === 'purchase-wizard'
  const canCreateAccount = source === 'pro-free' || source === 'pro-trial' || isPurchaseOnboarding

  const { user: existing, matchedBy } = await resolveExistingUser(
    db,
    provider,
    identity.providerUserId,
    identity.allVerifiedEmails,
  )

  // Cross-provider conflict refusal: an account exists (matched by stripeEmail)
  // but has no identity row for THIS provider. Refuse silent linking; instruct
  // the user to sign in with the original provider, then link from settings.
  if (existing && matchedBy === 'stripeEmail') {
    const otherIdentities = await db.query.userIdentities.findMany({
      where: eq(schema.userIdentities.userId, existing.userId),
    }).catch(() => [])
    if (otherIdentities.length && !otherIdentities.some(r => r.provider === provider)) {
      const original = otherIdentities[0]!.provider
      const emailParam = identity.email ? `&email=${encodeURIComponent(identity.email)}` : ''
      if (source)
        deleteCookie(event, 'auth-source')
      return sendRedirect(event, `/login?error=use_existing_provider&provider=${original}${emailParam}`)
    }
  }

  let dbUserId: number | null = existing?.userId ?? null
  let apiKey: string = existing?.apiKey ?? generateApiKey()
  let isNewUser = false

  if (!existing) {
    if (!canCreateAccount) {
      if (source)
        deleteCookie(event, 'auth-source')
      return sendRedirect(event, `/login?error=${encodeURIComponent('no_account')}`)
    }
    // Create user via the canonical helper: inserts users row, creates a personal
    // team, and sets currentTeamId. Identity row written inline.
    const created = await createUserWithPersonalTeam(
      db,
      {
        name: identity.name ?? identity.email?.split('@')[0] ?? 'New user',
        email: identity.email ?? `${identity.providerUserId}@${provider}.local`,
        avatar: identity.avatarUrl ?? '',
        lastLogin: Date.now(),
        sub: identity.providerUserId,
        apiKey,
        source: source ?? undefined,
      },
      {
        provider,
        providerUserId: identity.providerUserId,
        email: identity.email,
        emailVerified: identity.emailVerified,
        displayName: identity.name ?? null,
        avatarUrl: identity.avatarUrl ?? null,
      },
    ).catch((err) => {
      logger.error('[auth] user insert failed:', err)
      return null
    })
    if (!created)
      return sendRedirect(event, `/pro?error=${encodeURIComponent('Failed to create account')}`)
    dbUserId = created.user.userId
    apiKey = created.user.apiKey ?? apiKey
    isNewUser = true
  }
  else if (matchedBy === 'identity') {
    // Refresh apiKey if missing.
    if (!existing.apiKey) {
      await db.update(users).set({ apiKey, updatedAt: Date.now() }).where(eq(users.userId, existing.userId)).catch((error: unknown) => logger.error('[auth] apikey refresh failed:', error))
    }
    else {
      apiKey = existing.apiKey
    }
  }

  // Upsert identity row.
  const identityRow = await upsertIdentity(db, {
    userId: dbUserId!,
    provider,
    identity,
  })

  // For new users we await the user:created hook to give subscribers the chance
  // to set up team/onboarding/etc. Failures here log but don't block sign-in;
  // best-effort matches createUserWithPersonalTeam convention.
  try {
    if (isNewUser) {
      await useAuthHooks().callHook('user:created', {
        event,
        user: { id: dbUserId!, apiKey, source: source ?? null },
        identity: identityRow,
        isNewUser: true,
        sourceCookie: source ?? null,
      })
    }
    else {
      await useAuthHooks().callHook('user:signed-in', {
        event,
        user: { id: dbUserId!, apiKey, source: source ?? null },
        identity: identityRow,
        sourceCookie: source ?? null,
      })
    }
  }
  catch (err) {
    logger.error('[auth] user hook failed:', err)
  }

  const finalUser = await db.query.users.findFirst({
    where: eq(users.userId, dbUserId!),
    columns: { currentTeamId: true, apiKey: true },
  }).catch(() => null)

  await setAuthSession(
    event,
    { id: dbUserId!, apiKey: finalUser?.apiKey ?? apiKey, currentTeamId: finalUser?.currentTeamId ?? null },
    identityRow,
  )

  // Source-driven onboarding redirects (preserve current GitHub flow behaviour).
  if (isNewUser) {
    if (source)
      deleteCookie(event, 'auth-source')
    if (isPurchaseOnboarding)
      return sendRedirect(event, '/pro/onboarding?intent=purchase')
    if (source === 'pro-free')
      return sendRedirect(event, '/pro/onboarding?intent=free')
    if (source === 'pro-trial')
      return sendRedirect(event, '/pro/onboarding?intent=trial')
    return sendRedirect(event, '/dashboard')
  }

  // Honour stashed deep-link for returning users only.
  const stashed = getCookie(event, 'auth-redirect')
  if (stashed)
    deleteCookie(event, 'auth-redirect')
  const safe = safeAuthRedirect(stashed)
  return sendRedirect(event, safe ?? '/dashboard')
}

export interface AttachIdentityOpts {
  event: H3Event
  provider: AuthProviderId
  identity: NormalizedIdentity
}

export async function attachIdentityToCurrentSession({ event, provider, identity }: AttachIdentityOpts) {
  const session = await getUserSession(event)
  if (!session?.user?.id)
    return sendRedirect(event, '/login?error=link_requires_session')
  const sameOriginOk = (() => {
    const sec = getHeader(event, 'sec-fetch-site')
    return !sec || sec === 'same-origin' || sec === 'same-site' || sec === 'none'
  })()
  if (!sameOriginOk)
    throw createError({ statusCode: 403, statusMessage: 'cross_origin_link_blocked' })

  const db = useDrizzle(event)
  const result = await attachIdentityToUser(db, session.user.id as unknown as number, provider, identity)
  if (!result.ok) {
    if (result.reason === 'already_linked_other_user')
      return sendRedirect(event, `/pro/dashboard/account?error=link_conflict&provider=${provider}`)
    return sendRedirect(event, `/pro/dashboard/account?notice=already_linked&provider=${provider}`)
  }

  try {
    await useAuthHooks().callHook('user:identity-linked', {
      event,
      user: { id: session.user.id as unknown as number, apiKey: session.apiKey ?? '', source: null },
      identity: result.identity,
    })
  }
  catch (err) {
    logger.error('[auth] identity-linked hook failed:', err)
  }

  return sendRedirect(event, `/pro/dashboard/account?notice=linked&provider=${provider}`)
}
