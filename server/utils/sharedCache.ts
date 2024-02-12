import type { GoogleSearchConsoleSite, NitroAuthData } from '~/types'
import { fetchGoogleSearchConsoleSites } from '~/server/utils/api/googleSearchConsole'

export const fetchSitesCached = cachedFunction<GoogleSearchConsoleSite[], [NitroAuthData, boolean]>(
  async ({ tokens }: NitroAuthData) => {
    return await fetchGoogleSearchConsoleSites(tokens)
  },
  {
    maxAge: 60 * 10,
    group: 'app',
    name: 'user',
    validate(item) {
      return Array.isArray(item) && Boolean(item.length)
    },
    shouldInvalidateCache(_, force?: boolean) {
      return !!force
    },
    transform(entry) {
      if (entry.value)
        return entry.value.sort((a, b) => normalizeSiteUrlForKey(a.siteUrl).localeCompare(normalizeSiteUrlForKey(b.siteUrl)))
    },
    getKey: (authData: NitroAuthData) => `${authData.user.userId}:sites`,
  },
)
