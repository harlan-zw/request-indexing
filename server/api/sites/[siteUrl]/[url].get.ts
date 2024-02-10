import { searchconsole } from '@googleapis/searchconsole'
import type { GaxiosError } from 'googleapis-common'
import { getUserNonIndexedUrls } from '~/server/utils/nonIndexedUrlStorage'
import { createGoogleOAuthClient } from '~/server/utils/googleSearchConsole'

export default defineEventHandler(async (event) => {
  const { tokens, user } = event.context.authenticatedData

  const { siteUrl, url } = getRouterParams(event, { decode: true })

  const urlDb = await getUserNonIndexedUrls(user.userId, siteUrl)
  // find for url
  const lastInspected = urlDb.find(u => u.url === url)?.lastInspected
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
    .then((res) => {
      // only save lastInspected if it was successful
      return updateUserNonIndexedUrl(user.userId, siteUrl, { ...res.data, url, lastInspected: Date.now() })
    })
    .catch((e: GaxiosError) => {
      // if we have a 400 error, it means we've been unauthorized, send proper error
      if (e.response?.status === 400) {
        throw createError({
          statusCode: 401,
          statusText: 'Unauthorized',
        })
      }
      throw e
    })
})
