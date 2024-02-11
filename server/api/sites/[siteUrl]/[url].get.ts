import { searchconsole } from '@googleapis/searchconsole'
import type { GaxiosError } from 'googleapis-common'
import { parseURL } from 'ufo'
import { createGoogleOAuthClient } from '~/server/utils/api/googleSearchConsole'
import { getUserSite, updateUserSite } from '~/server/utils/storage'
import type { SitePage } from '~/types'

export default defineEventHandler(async (event) => {
  const { tokens, user } = event.context.authenticatedData

  const { siteUrl, url } = getRouterParams(event, { decode: true })

  const { urls } = await getUserSite(user.userId, siteUrl)
  // find for url
  const lastInspected = urls.filter(Boolean).find(u => parseURL(u.url).pathname === url)?.lastInspected
  if (lastInspected) {
    // compare with current time, if it's within 1 hour then we block them
    if (Date.now() - lastInspected < 1000 * 60 * 60) {
      return sendError(event, createError({
        statusCode: 429,
        statusText: `You can only check the URL index status once per hour. Try again in ${Math.round((1000 * 60 * 60 - (Date.now() - lastInspected)) / 1000 / 60)} minutes.`,
      }))
    }
  }

  const gscApi = searchconsole({
    version: 'v1',
    auth: createGoogleOAuthClient(tokens),
  })
  return gscApi.urlInspection.index.inspect({
    requestBody: {
      inspectionUrl: url,
      siteUrl,
    },
  })
    .then(async (res) => {
      const page: SitePage = { ...res.data, url, lastInspected: Date.now() }
      await updateUserSite(user.userId, siteUrl, { urls: [page] })
      // only save lastInspected if it was successful
      return page
    })
    .catch((e: GaxiosError) => {
      // if we have a 400 error, it means we've been unauthorized, send proper error
      if (e.response?.status === 400) {
        throw createError({
          statusCode: 401,
          statusText: 'Unauthorized',
        })
      }
      else if (e.response?.status === 500) {
        throw createError({
          statusCode: 500,
          statusText: 'Google Server is rate limiting us. Please try again in a minute.',
        })
      }
      throw e
    })
})
