import { searchconsole } from '@googleapis/searchconsole'
import type { SiteExpanded, User } from '~/types'
import { createGoogleOAuthClient } from '~/server/app/services/gsc'
import { formatDateGsc } from '~/server/app/utils/formatting'

export default defineEventHandler(async (event) => {
  const { user, site: _site } = await readBody<User>(event)
  const { tokens } = await getUserToken(user.userId, 'login') || {}

  const userSiteStorage = await userAppStorage(user.userId, `sites`)
  // if we're resyncing the file needs to be removed first for safety
  if (!(await userSiteStorage.hasItem(`sites.json`))) {
    return createError({
      statusCode: 400,
      message: 'Sites not found',
    })
  }

  const sites = await userSiteStorage.getItem<SiteExpanded[]>(`sites.json`)
  const site = sites.find(s => s.domain === _site)
  if (!site) {
    return createError({
      statusCode: 404,
      message: 'Site not found',
    })
  }

  const storage = userAppStorage(user.userId, `sites:${normalizeUrlStorageKey(site.domain)}:gsc:web`)
  // TODO tmp workaround
  if (await storage.hasItem(`dates.json`))
    return 'ok'

  const api = searchconsole({
    version: 'v1',
    auth: createGoogleOAuthClient(tokens),
  })

  const startPeriod = new Date()
  startPeriod.setDate(new Date().getDate() - 500) // 16 months

  const rows = await api.searchanalytics.query({
    siteUrl: site.siteUrl,
    requestBody: {
      startDate: formatDateGsc(startPeriod),
      endDate: formatDateGsc(),
      dimensions: ['date'],
      dataState: 'all',
      type: 'web',
      // row should not exceed 500
      // need to filter for the selected domain
      dimensionFilterGroups: site.siteUrl.startsWith('sc-domain:')
        ? [{
            filters: [{
              dimension: 'page',
              operator: 'includingRegex',
              expression: `^https?://${site.domain.replace(/\./g, '\\.')}/.*`,
            }],
          }]
        : [],
    },
  }).then(res => (res.data.rows || []))
  // make an object with the key as the date
  const dates = rows.reduce((acc, row) => {
    acc[row.keys![0]] = row
    return acc
  }, {})

  const startDate = (rows[0]?.keys![0]) || formatDateGsc(startPeriod)
  const endDate = (rows[rows.length - 1]?.keys![0]) || formatDateGsc()
  await storage.setItem(`dates.json`, { startDate, endDate, rows: dates })
  // for each day in the last 180 days, store the data in the storage
  for (const row of rows)
    await storage.setItem(`dates:${row.keys![0].replaceAll('-', ':')}.json`, { date: row })

  const queuePayload = {
    user: { userId: user.userId },
    site,
    startRow: 0,
    startDate,
    endDate,
  }

  const mq = useMessageQueue()
  await mq.message(`/api/_mq/ingest/site/pages`, queuePayload)
  await mq.message(`/api/_mq/ingest/site/keywords`, queuePayload)

  // we'll create messages for batch processing the data fully
  return 'OK'
})
