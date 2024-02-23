import { searchconsole } from '@googleapis/searchconsole'
import type { User } from '~/types'
import { createGoogleOAuthClient } from '~/server/app/services/gsc'
import { formatDateGsc } from '~/server/app/utils/formatting'

export default defineEventHandler(async (event) => {
  const { user, site } = await readBody<User>(event)
  const { tokens } = await getUserToken(user.userId, 'login') || {}

  const storage = userGoogleSearchConsoleStorage(user.userId, site.domain)
  // TODO tmp workaround
  if (await storage.hasItem(`keywords.json`))
    return 'ok'

  const api = searchconsole({
    version: 'v1',
    auth: createGoogleOAuthClient(tokens),
  })

  // we need accurate data, use last 6 weeks
  const startPeriod = new Date()
  startPeriod.setDate(new Date().getDate() - 42)

  const rows = await api.searchanalytics.query({
    siteUrl: site.siteUrl,
    requestBody: {
      startDate: formatDateGsc(startPeriod),
      endDate: formatDateGsc(),
      dataState: 'all',
      dimensions: ['query'],
      type: 'web',
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

  await storage.setItem(`keywords.json`, rows.map((row) => {
    return { ...row, keyword: row.keys![0], keys: undefined }
  }))

  // we'll create messages for batch processing the data fully
  return 'OK'
})
