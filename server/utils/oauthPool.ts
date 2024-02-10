import { hash } from 'ohash'
import type { OAuthPoolToken } from '~/types'

export function oauthPool() {
  const { seed, maxUsersPerOAuth } = useRuntimeConfig().indexing
  let pool: OAuthPoolToken[] = []
  async function resolvePool() {
    if (!pool.length) {
      await Promise.all(
        (await oAuthPoolStorage.getKeys()).map(async (k) => {
          const token = await oAuthPoolStorage.getItem(k)
          if (token!.uses < maxUsersPerOAuth)
            pool.push(token!)
        }),
      )
    }
    if (!pool.length && !!seed) {
      pool = (seed as any as OAuthPoolToken[]).map(token => ({
        // creating a new token here
        ...token,
        id: hash(token),
        users: [],
      }))
      await oAuthPoolStorage.setItems(
        // @ts-expect-error unstorage types are wrong
        pool.map(token => ({ key: token.id, value: token })),
      )
    }
    return pool
  }
  return {
    async get(id: string) {
      pool = await resolvePool()
      return pool.find(oauth => oauth.id === id)
    },
    async free() {
      pool = await resolvePool()
      return pool.find(oauth => oauth.users.length < maxUsersPerOAuth)
    },
    async claim(id: string, userId: string) {
      pool = await resolvePool()
      const token = pool.find(oauth => oauth.id === id)
      if (token) {
        token.users = [...new Set<string>([...token.users, userId])]
        await oAuthPoolStorage.setItem(token.id, token)
      }
    },
    async release(id: string, userId: string) {
      const token = pool.find(oauth => oauth.id === id)
      if (token) {
        token.users = (token.users || []).filter(u => u !== userId)
        await oAuthPoolStorage.setItem(id, token)
      }
    },
  }
}
