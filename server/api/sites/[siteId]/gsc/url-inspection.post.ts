import { inspectGscUrl } from '~/server/app/services/gsc'
import { authenticateUser } from '~/server/app/utils/auth'
import { requireEventSite } from '~/server/app/services/util'
import { sitePaths } from '~/server/database/schema'

export default defineEventHandler(async (event) => {
  const user = await authenticateUser(event)
  const { site, googleAccount } = await requireEventSite(event, user)
  const { path } = await readBody(event)
  // query siteUrls
  const siteUrl = await useDrizzle().query.sitePaths.findFirst({
    where: and(eq(sitePaths.siteId, site.siteId), eq(sitePaths.path, path)),
  })

  if (!siteUrl) {
    return sendError(event, createError({
      statusCode: 404,
      statusText: 'Not Found',
    }))
  }

  // find for path
  if (siteUrl.lastInspected) {
    // compare with current time, if it's within 1 hour then we block them
    if (Date.now() - siteUrl.lastInspected < 1000 * 60 * 60) {
      // return sendError(event, createError({
      //   statusCode: 429,
      //   statusText: `You can only check the path index status once per hour. Try again in ${Math.round((1000 * 60 * 60 - (Date.now() - siteUrl.lastInspected)) / 1000 / 60)} minutes.`,
      // }))
    }
  }

  return await inspectGscUrl(googleAccount, site, path)
  //
  // .then(async (res) => {
  //   const page: SitePage = { ...res.data, path, lastInspected: Date.now() }
  //   // await updateUserSite(user.userId, site.domain, { urls: [page] })
  //   // only save lastInspected if it was successful
  //   return page
  // })
  // .catch((e: GaxiosError) => {
  //   // if we have a 400 error, it means we've been unauthorized, send proper error
  //   if (e.response?.status === 400) {
  //     throw createError({
  //       statusCode: 401,
  //       statusText: 'Unauthorized',
  //     })
  //   }
  //   else if (e.response?.status === 500) {
  //     throw createError({
  //       statusCode: 500,
  //       statusText: 'Google Server is rate limiting us. Please try again in a minute.',
  //     })
  //   }
  //   throw e
  // })
})
