import type { Storage, StorageValue } from 'unstorage'
import { prefixStorage } from 'unstorage'
import { defu } from 'defu'
import type { OAuthPoolToken, User } from '~/types'

export interface UserAppStorage {

}

export function normalizeSiteUrlForKey(siteUrl: string) {
  // strip https, strip sc-domain, strip non-alphanumeric
  return siteUrl
    .replace('https://', '')
    .replace('sc-domain:', '')
    .replace(/[^a-z0-9]/g, '')
}

const appStorage = prefixStorage(useStorage(), 'cache:app')

export const oAuthPoolStorage = prefixStorage(appStorage as Storage<OAuthPoolToken>, 'auth:pool')

export function userAppStorage<T extends StorageValue = UserAppStorage>(userId: string, namespace?: string) {
  if (!userId)
    throw new Error('userId is required')

  return prefixStorage(appStorage as Storage<T>, `user:${userId}${namespace ? `:${namespace}` : ''}`)
}

export function userSiteAppStorage<T extends StorageValue = UserAppStorage>(userId: string, siteUrl: string, namespace?: string) {
  return prefixStorage(appStorage as Storage<T>, `user:${userId}:sites:${normalizeSiteUrlForKey(siteUrl)}:${namespace ? `:${namespace}` : ''}`)
}

export async function updateUser(userId: string, value: Partial<User>) {
  return userAppStorage(userId).setItem('me.json', defu(value, await getUser(userId)))
}

export async function getUser(userId: string) {
  return await userAppStorage(userId).getItem('me.json')
}
