import type { GoogleSearchConsoleSite, NitroAuthData } from '~/types'
import { fetchGoogleSearchConsoleSites } from '~/server/utils/googleSearchConsole'

export const fetchSitesCached = cachedFunction<GoogleSearchConsoleSite[], [NitroAuthData, boolean]>(
  async ({ tokens }: NitroAuthData) => {
    return await fetchGoogleSearchConsoleSites(tokens)
  },
  {
    maxAge: 60 * 10,
    group: 'app',
    name: 'user',
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
