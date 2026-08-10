import type { H3Event } from 'h3'
import type { AuthProviderId, NormalizedIdentity } from '../../../shared/types/auth'

export interface AuthProvider {
  id: AuthProviderId
  label: string
  icon: string
  scope: string[]
  authorizationParams?: Record<string, string>
  // Promotion: can an existing integration grant be lifted into a sign-in
  // identity without a second consent? Only true where we already hold a live
  // OAuth grant with email+profile coverage (Google via the GSC flow).
  canPromoteFromIntegration?: boolean
  resolveIdentity: (event: H3Event, ctx: { tokens: any, user: any }) => Promise<NormalizedIdentity>
}

const githubProvider: AuthProvider = {
  id: 'github',
  label: 'GitHub',
  icon: 'i-simple-icons-github',
  scope: ['read:user', 'user:email'],
  canPromoteFromIntegration: false,
  async resolveIdentity(_event, { tokens, user }) {
    interface GhEmail { email: string, primary: boolean, verified: boolean }
    const emails = await $fetch<GhEmail[]>('https://api.github.com/user/emails', {
      headers: {
        Authorization: `Bearer ${tokens.access_token}`,
        Accept: 'application/vnd.github+json',
      },
    }).catch(() => [] as GhEmail[])

    const verified = emails
      .filter(e => e.verified)
      .sort((a, b) => (b.primary ? 1 : 0) - (a.primary ? 1 : 0))
      .map(e => e.email)

    const email = verified[0] ?? user.email ?? null
    return {
      providerUserId: String(user.id),
      email,
      emailVerified: !!email && verified.includes(email),
      name: user.login ?? user.name ?? null,
      avatarUrl: user.avatar_url ?? (user.login ? `https://github.com/${user.login}.png` : null),
      allVerifiedEmails: verified,
    }
  },
}

const googleProvider: AuthProvider = {
  id: 'google',
  label: 'Google',
  // Brand mark: simple-icons monochrome until Google verification is needed
  // for high-trust scopes. Sign-in uses openid/email/profile only.
  icon: 'i-simple-icons-google',
  scope: ['openid', 'email', 'profile'],
  authorizationParams: { prompt: 'select_account' },
  canPromoteFromIntegration: true,
  async resolveIdentity(_event, { user }) {
    // userinfo v3 response: sub, email, email_verified, name, picture, ...
    const email = user.email ?? null
    const emailVerified = !!user.email_verified
    return {
      providerUserId: String(user.sub),
      email,
      emailVerified,
      name: user.name ?? null,
      avatarUrl: user.picture ?? null,
      allVerifiedEmails: emailVerified && email ? [email] : [],
    }
  },
}

export const authProviders = {
  github: githubProvider,
  google: googleProvider,
} satisfies Record<AuthProviderId, AuthProvider>

export function getAuthProvider(id: string): AuthProvider | undefined {
  return (authProviders as Record<string, AuthProvider>)[id]
}
