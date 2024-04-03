import { indexing } from '@googleapis/indexing'
import type { GaxiosError } from 'googleapis-common'
import { OAuth2Client } from 'googleapis-common'
import type { indexing_v3 } from '@googleapis/indexing/v3'
import { getUserToken, updateUserSite } from '~/server/utils/storage'
import { getUserQuotaUsage, incrementUserQuota } from '~/server/utils/quota'
import type { SitePage, UserSession } from '~/types'

export default defineEventHandler(async (event) => {
  const { user } = event.context.authenticatedData

  const { url } = getRouterParams(event, { decode: true })

  const { siteUrl: _siteUrl } = getQuery(event)

  const siteUrl = decodeURIComponent(_siteUrl as string)

  const tokens = await getUserToken(user.userId, 'indexing')

  const { indexing: indexingConfig } = useRuntimeConfig().public
  const quotaLimit = user.access === 'pro' ? 200 : indexingConfig.usageLimitPerUser
  // increment users usage
  const quota = await getUserQuotaUsage(user.userId, 'indexingApi')
  if (quota >= quotaLimit) {
    return sendError(event, createError({
      statusCode: 429,
      statusText: 'Daily API Quota exceeded.',
    }))
  }
  const pool = createOAuthPool().get(user.indexingOAuthIdNext || '')
  if (!user.indexingOAuthIdNext || !pool) {
    return sendError(event, createError({
      statusCode: 401,
      statusText: 'Invalid Google account. Please reconnect your account.',
    }))
  }
  const oauth2Client = new OAuth2Client({
    clientId: pool.client_id,
    clientSecret: pool.client_secret,
  })
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
    const page: SitePage = { urlNotificationMetadata: metadata, url }
    // already published, update link and return it
    await updateUserSite(user.userId, siteUrl, { urls: [page] })
    return {
      status: 'already-submitted',
      url: page,
    }
  }

  const res = await api.urlNotifications.publish({
    requestBody: {
      type: 'URL_UPDATED',
      url: decodeURIComponent(url),
    },
  })
    .then(res => res.data)

  await setUserSession(event, <UserSession> {
    // public data only!
    user: {
      quota: {
        indexingApi: await incrementUserQuota(user.userId, 'indexingApi'),
      },
    },
  })

  const page: SitePage = { ...res, url }
  await updateUserSite(user.userId, siteUrl, { urls: [page] })

  return {
    status: 'submitted',
    url: page,
  }
})
