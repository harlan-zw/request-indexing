import { indexing } from '@googleapis/indexing'
import type { GaxiosError } from 'googleapis-common'
import { OAuth2Client } from 'googleapis-common'
import type { Credentials } from 'google-auth-library'
import type { indexing_v3 } from '@googleapis/indexing/v3'

export default defineEventHandler(async (event) => {
  const { user } = event.context.authenticatedData

  const { url } = getRouterParams(event, { decode: true })

  const { siteUrl: _siteUrl } = getQuery(event)

  const siteUrl = decodeURIComponent(_siteUrl as string)

  const appStorage = userAppStorage(user.userId)
  const tokens = await appStorage.getItem<Credentials>('indexing-tokens')

  const { indexing: indexingConfig } = useRuntimeConfig().public
  // increment users usage
  const quota = await useUserIndexingApiQuota(user.userId)
  if (quota.value >= indexingConfig.usageLimitPerUser) {
    return sendError(event, createError({
      statusCode: 429,
      statusText: 'Daily API Quota exceeded. Please upgrade your plan.',
    }))
  }

  const oauth2Client = new OAuth2Client()
  oauth2Client.setCredentials(tokens!)
  const api = indexing({
    version: 'v3',
    auth: oauth2Client,
  })
  const metadata = await api.urlNotifications.getMetadata({
    url: decodeURIComponent(url),
  })
    .then(res => res.data)
    .catch((e: GaxiosError) => {
      if (e.status === 404)
        return { latestUpdate: { type: 'URL_MISSING' } } as indexing_v3.Schema$UrlNotificationMetadata
      else
        return { latestUpdate: { type: 'URL_ERROR' } } as indexing_v3.Schema$UrlNotificationMetadata
    })

  // notify time looks like "2024-02-05T05:11:09.069175248Z"
  // check if the notify time was within the last 48 hours, if so we can skip
  const submittedLast48Hours = metadata.latestUpdate?.notifyTime
    ? new Date(metadata.latestUpdate.notifyTime) > new Date(Date.now() - 1000 * 60 * 60 * 48)
    : false
  if (metadata.latestUpdate?.type === 'URL_UPDATED' && submittedLast48Hours) {
    // already published, update link and return it
    return {
      status: 'already-submitted',
      url: await updateUserNonIndexedUrl(user.userId, siteUrl, { urlNotificationMetadata: metadata, url }),
    }
  }

  const res = await api.urlNotifications.publish({
    requestBody: {
      type: 'URL_UPDATED',
      url: decodeURIComponent(url),
    },
  })
    .then(res => res.data)

  const quotaCount = await quota.increment()
  await setUserSession(event, {
    // public data only!
    user: {
      indexingApiQuota: quotaCount,
    },
  })

  return { status: 'submitted', url: await updateUserNonIndexedUrl(user.userId, siteUrl, { ...res, url }) }
})
