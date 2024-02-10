import { defu } from 'defu'
import { userSiteAppStorage } from '~/server/utils/storage'

export async function getUserNonIndexedUrls(userId: string, siteUrl: string) {
  return (await userSiteAppStorage<NonIndexedUrl[]>(userId, siteUrl, 'nonIndexedUrls')
    .getItem('')) || []
}

export async function updateUserNonIndexedUrl(userId: string, siteUrl: string, url: NonIndexedUrl) {
  const urlDb = await getUserNonIndexedUrls(userId, siteUrl)

  // either patch or insert the new status
  const existing = urlDb.findIndex(u => u.url === url.url)
  // merge using defu
  if (existing >= 0)
    urlDb[existing] = defu(url, urlDb[existing])
  else
    urlDb.push(url)

  ;(await userSiteAppStorage<NonIndexedUrl[]>(userId, siteUrl, 'nonIndexedUrls')
    .setItem('', urlDb))
  return url
}
