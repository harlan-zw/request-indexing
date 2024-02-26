import type { Storage, StorageValue } from 'unstorage'
import { prefixStorage } from 'unstorage'
import { createDefu, defu } from 'defu'
import { parse, stringify } from 'devalue'
import type { User, UserOAuthToken, UserSite } from '~/types'
import { decryptToken, encryptToken } from '~/server/utils/crypto'
import { useRuntimeConfig } from '#imports'

export interface UserAppStorage {}

export function normalizeSiteUrlForKey(siteUrl: string) {
  // strip https, strip sc-domain, strip non-alphanumeric
  return siteUrl
    .replace('https://', '')
    .replace('sc-domain:', '')
    .replace(/[^a-z0-9]/g, '')
}

export const appStorage = prefixStorage(useStorage(), 'app')

export function userAppStorage<T extends StorageValue = UserAppStorage>(userId: string, namespace?: string) {
  if (!userId)
    throw new Error('userId is required')

  return prefixStorage(appStorage as Storage<T>, `user:${userId}${namespace ? `:${namespace}` : ''}`)
}

function userSiteAppStorage<T extends StorageValue = UserAppStorage>(userId: string, siteUrl: string, namespace?: string) {
  return prefixStorage(appStorage as Storage<T>, `user:${userId}:sites:${normalizeSiteUrlForKey(siteUrl)}:${namespace ? `:${namespace}` : ''}`)
}

export const userMerger = createDefu((data, key, value) => {
  // we want to override arrays when an empty one is provided
  if (Array.isArray(data[key]) && Array.isArray(value)) {
    data[key] = value
    return true
  }
})

export async function updateUser(userId: string, value: Partial<User>) {
  const updated = userMerger(value, await getUser(userId))
  await userAppStorage(userId).setItem('me.json', updated)
  return updated
}

export function getUser(userId: string) {
  return userAppStorage(userId).getItem('me.json')
}

export async function getUserSite(userId: string, siteUrl: string) {
  return (await userSiteAppStorage<UserSite>(userId, siteUrl)
    .getItem('payload.json')) || { urls: [] } satisfies UserSite
}

const userSiteMerger = createDefu((data, key, value) => {
  if (key === 'urls' && Array.isArray(value)) {
    // dedupe the array based on the url
    const urlsToAdd = [...value].filter(Boolean)
    data.urls = data.urls.filter(Boolean).map((u) => {
      const existing = urlsToAdd.findIndex(v => v?.url === u?.url)
      if (existing >= 0) {
        const val = urlsToAdd[existing]
        delete urlsToAdd[existing]
        return defu(val, u)
      }
      return u
    }).filter(Boolean)
    // just append new urls
    data.urls.push(...urlsToAdd)
    return true
  }
})
export async function updateUserSite(userId: string, siteUrl: string, payload: Partial<UserSite>) {
  const siteData = await getUserSite(userId, siteUrl)
  return userSiteAppStorage<UserSite>(userId, siteUrl).setItem('payload.json', userSiteMerger(payload, siteData))
}

export async function clearUserStorage(userId: string) {
  const keys = await userAppStorage(userId).getKeys()
  for (const key of keys)
    await userAppStorage(userId).removeItem(key)
}

export async function updateUserToken(userId: string, key: 'indexing' | 'login', value: Partial<UserOAuthToken>) {
  // need to encrypt
  const encrypted = encryptToken(stringify(value), useRuntimeConfig().key)
  return userAppStorage(userId, 'tokens').setItem(`${key}.json`, encrypted)
}

export async function getUserToken(userId: string, key: 'indexing' | 'login') {
  const token = await userAppStorage<string>(userId, 'tokens').getItem(`${key}.json`)
  if (token)
    return parse(decryptToken(token, useRuntimeConfig().key))
  return token
}

export function deleteUserToken(userId: string, key: 'indexing' | 'login') {
  return userAppStorage<string>(userId, 'tokens').removeItem(`${key}.json`)
}

export async function incrementMetric(key: string) {
  const analytics = prefixStorage<number>(appStorage, 'analytics')
  const newVal = (await analytics.getItem(key) || 0) + 1
  await analytics.setItem(key, newVal)
  return newVal
}

export async function getMetric(key: string) {
  return (await prefixStorage<number>(appStorage, 'analytics').getItem(key)) || 0
}
