import type { Storage } from 'unstorage'
import { prefixStorage } from 'unstorage'
import type { OAuthPoolPayload, OAuthPoolToken } from '~/types'
import { appStorage } from '~/server/utils/storage'

// @ts-expect-error runtime
import { tokens as _tokens, privateTokens } from '#app/token-pool.mjs'

export const oAuthPoolStorage = prefixStorage(appStorage as Storage<OAuthPoolPayload>, 'auth:pool')

export function createOAuthPool() {
  const tokens = _tokens as OAuthPoolToken[]
  const { maxUsersPerOAuth } = useRuntimeConfig().indexing
  return {
    get(id: string) {
      const token = tokens.find(t => t.id === id)
      if (token)
        return token
      const privateToken = privateTokens.find(t => t.id === id)
      if (privateToken)
        return privateToken
    },
    async free() {
      const available = (await Promise.all(
        tokens.map(async (k) => {
          const payload = await oAuthPoolStorage.getItem(k.id) || { id: k.id, users: [] } satisfies OAuthPoolPayload
          return payload!.users.length < maxUsersPerOAuth ? k : null
        }),
      )).filter(Boolean) as OAuthPoolToken[]
      // get random available token
      if (available.length)
        return available[Math.floor(Math.random() * available.length)]
    },
    async claim(id: string, userId: string) {
      const token = tokens.find(t => t.id === id)
      if (token) {
        const payload = await oAuthPoolStorage.getItem(token.id) || { id: token.id, users: [] } satisfies OAuthPoolPayload
        payload.users = [...new Set<string>([...payload.users, userId])]
        await oAuthPoolStorage.setItem(token.id, payload)
      }
    },
    async release(id: string, userId: string) {
      const token = tokens.find(t => t.id === id)
      if (token) {
        const payload = await oAuthPoolStorage.getItem(token.id) || { id: token.id, users: [] } satisfies OAuthPoolPayload
        payload.users = payload.users.filter(u => u !== userId)
        await oAuthPoolStorage.setItem(token.id, payload)
      }
    },
    async usage() {
      // iterate tokens, fetch payload, count users
      const usage = await Promise.all(tokens.map(async (t) => {
        const payload = await oAuthPoolStorage.getItem(t.id) || { id: t.id, users: [] } satisfies OAuthPoolPayload
        return payload.users.length
      }))
      // want to return how many have been used and how many are free
      return {
        used: usage.reduce((a, b) => a + b, 0),
        free: usage.length * maxUsersPerOAuth - usage.reduce((a, b) => a + b, 0),
      }
    },
  }
}
