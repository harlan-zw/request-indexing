import { createDefu, defu } from 'defu'
import type { Storage, StorageValue } from 'unstorage'
import { prefixStorage } from 'unstorage'
import type { UserSite } from '~/types'

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
        return defu(u, val)
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

function userSiteAppStorage<T extends StorageValue = UserAppStorage>(userId: string, siteUrl: string, namespace?: string) {
  return prefixStorage(appStorage as Storage<T>, `user:${userId}:sites:${normalizeUrlStorageKey(siteUrl)}:${namespace ? `:${namespace}` : ''}`)
}

export function userGoogleSearchConsoleStorage(userId: string, siteUrl: string) {
  return userSiteAppStorage(userId, siteUrl, 'gsc:web')
}
