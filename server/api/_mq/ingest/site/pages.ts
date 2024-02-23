import { searchconsole } from '@googleapis/searchconsole'
import type { User } from '~/types'
import { createGoogleOAuthClient } from '~/server/app/services/gsc'

export default defineEventHandler(async (event) => {
  const { user, site, startRow } = await readBody<User>(event)
  const { tokens } = await getUserToken(user.userId, 'login') || {}

  const storage = userGoogleSearchConsoleStorage(user.userId, site.domain)
  // TODO tmp workaround
  if (await storage.hasItem(`pages-indexed.json`))
    return 'ok'

  const api = searchconsole({
    version: 'v1',
    auth: createGoogleOAuthClient(tokens),
  })

  // we need accurate data, use last 6 weeks
  const startPeriod = new Date()
  startPeriod.setDate(new Date().getDate() - 500)

  const rows = await api.searchanalytics.query({
    siteUrl: site.siteUrl,
    requestBody: {
      startDate: formatDateGsc(startPeriod),
      endDate: formatDateGsc(),
      dataState: 'all',
      dimensions: ['page'],
      type: 'web',
      startRow: startRow || 0,
      aggregationType: 'byPage',
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

  await storage.setItem(`pages.json`, rows.map((row) => {
    return {
      ...row,
      url: row.keys[0],
      keys: undefined,
    }
  }))

  // we'll create messages for batch processing the data fully
  return 'OK'
})
