import { lt } from 'drizzle-orm'
import { googleAccounts, googleOAuthClients } from '~/server/database/schema'
// import { tokens as _tokens, privateTokens } from '#app/token-pool.mjs'

// export const oAuthPoolStorage = prefixStorage(appStorage as Storage<OAuthPoolPayload>, 'auth:pool')

export function createOAuthPool() {
  const db = useDrizzle()
  // const tokens = _tokens as OAuthPoolToken[]
  const { maxUsersPerOAuth } = useRuntimeConfig().indexing
  return {
    get(id: number) {
      return db.query.googleOAuthClients.findFirst({ where: eq(googleOAuthClients.googleOAuthClientId, id) })
    },
    async free() {
      return db.select({
        googleOAuthClientId: googleOAuthClients.googleOAuthClientId,
        clientId: googleOAuthClients.clientId,
        clientSecret: googleOAuthClients.clientSecret,
        count: sql<number>`count(${googleAccounts.googleOAuthClientId})`,
        label: googleOAuthClients.label,
      }).from(googleOAuthClients)
        // make sure it's not reserved
        .where(eq(googleOAuthClients.reserved, false))
        .leftJoin(googleAccounts, eq(googleOAuthClients.googleOAuthClientId, googleAccounts.googleOAuthClientId))
        .groupBy(googleOAuthClients.googleOAuthClientId)
        .having(lt(sql<number>`count(${googleAccounts.googleOAuthClientId})`, maxUsersPerOAuth))
        .orderBy(sql<number>`count(${googleAccounts.googleOAuthClientId})`)
        .limit(1)
        .then(rows => rows?.[0] || null)
    },
    // async claim(id: number, user: UserSelect) {
    //   const token = tokens.find(t => t.id === id)
    //   if (token) {
    //     const payload = await oAuthPoolStorage.getItem(token.id) || { id: token.id, users: [] } satisfies OAuthPoolPayload
    //     payload.users = [...new Set<string>([...payload.users, userId])]
    //     await oAuthPoolStorage.setItem(token.id, payload)
    //   }
    // },
    // async release(id: string, userId: string) {
    //   //   const token = tokens.find(t => t.id === id)
    //   //   if (token) {
    //   //     const payload = await oAuthPoolStorage.getItem(token.id) || { id: token.id, users: [] } satisfies OAuthPoolPayload
    //   //     payload.users = payload.users.filter(u => u !== userId)
    //   //     await oAuthPoolStorage.setItem(token.id, payload)
    //   //   }
    // },
    async usage() {
      return await db.select({
        label: googleOAuthClients.label,
        reserved: googleOAuthClients.reserved,
        googleOAuthClientId: googleOAuthClients.googleOAuthClientId,
        count: sql<number>`count(${googleAccounts.googleAccountId})`,
      })
        .from(googleOAuthClients)
        .leftJoin(googleAccounts, eq(googleOAuthClients.googleOAuthClientId, googleAccounts.googleOAuthClientId))
        .groupBy(googleOAuthClients.googleOAuthClientId)
    },
  }
}
