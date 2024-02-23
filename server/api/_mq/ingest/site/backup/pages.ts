import { searchconsole } from '@googleapis/searchconsole'
import type { User } from '~/types'
import { createGoogleOAuthClient } from '~/server/app/services/gsc'

// TODO implement
export default defineEventHandler(async (event) => {
  const { user, site, startDate, endDate, startRow } = await readBody<User>(event)
  const { tokens } = await getUserToken(user.userId, 'login') || {}

  const storage = userGoogleSearchConsoleStorage(user.userId, site.siteUrl)
  // TODO tmp workaround
  if (await storage.hasItem(`pages.json`))
    return 'ok'

  const api = searchconsole({
    version: 'v1',
    auth: createGoogleOAuthClient(tokens),
  })

  const rows = await api.searchanalytics.query({
    siteUrl: site.siteUrl,
    requestBody: {
      startDate,
      endDate,
      dataState: 'all',
      dimensions: ['page'],
      type: 'web',
      startRow: startRow || 0,
      aggregationType: 'byPage',
    },
  }).then(res => (res.data.rows || []))

  const dateRecord: Record<string, Record<string, Record<string, any>>> = {}
  const urlRecord: Record<string, Record<string, Record<string, any>>> = {}
  rows.forEach((row) => {
    const [date, url] = row.keys!
    dateRecord[date] = dateRecord[date] || {}
    dateRecord[date][url] = { ...row, keys: undefined }
    urlRecord[url] = urlRecord[url] || {}
    urlRecord[url][date] = { ...row, keys: undefined }
  })
  for (const date in dateRecord)
    await storage.setItem(`dates:${date.replaceAll('-', ':')}.json`, dateRecord[date])
  for (const page in urlRecord)
    await storage.setItem(`pages:${normalizeUrlStorageKey(page)}.json`, urlRecord[page])

  // we'll create messages for batch processing the data fully
  return 'OK'
})
