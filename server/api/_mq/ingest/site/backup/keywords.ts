import { searchconsole } from '@googleapis/searchconsole'
import type { User } from '~/types'
import { createGoogleOAuthClient } from '~/server/app/services/gsc'
import { formatDateGsc } from '~/server/app/utils/formatting'

// TODO implement
export default defineEventHandler(async (event) => {
  const { user, site } = await readBody<User>(event)
  const { tokens } = await getUserToken(user.userId, 'login') || {}

  const storage = userGoogleSearchConsoleStorage(user.userId, site.siteUrl)
  // TODO tmp workaround
  if (await storage.hasItem(`keywords.json`))
    return 'ok'

  const api = searchconsole({
    version: 'v1',
    auth: createGoogleOAuthClient(tokens),
  })

  const startPeriod = new Date()
  startPeriod.setDate(new Date().getDate() - 1825)

  const rows = await api.searchanalytics.query({
    siteUrl: site.siteUrl,
    requestBody: {
      startDate: formatDateGsc(startPeriod),
      endDate: formatDateGsc(),
      dataState: 'all',
      dimensions: ['date', 'query'],
      type: 'web',
      aggregationType: 'byPage',
    },
  }).then(res => (res.data.rows || []))

  const dateRecord: Record<string, Record<string, Record<string, any>>> = {}
  const keywordRecord: Record<string, Record<string, Record<string, any>>> = {}
  rows.forEach((row) => {
    const [date, keyword] = row.keys!
    dateRecord[date] = dateRecord[date] || {}
    dateRecord[date][keyword] = { ...row, keys: undefined }
    keywordRecord[keyword] = keywordRecord[keyword] || {}
    keywordRecord[keyword][date] = { ...row, keys: undefined }
  })
  // TODO date?
  // for (const date in dateRecord)
  //   await storage.setItem(`dates:${date.replaceAll('-', ':')}.json`, dateRecord[date])
  for (const keyword in keywordRecord)
    await storage.setItem(`keywords:${normalizeUrlStorageKey(keyword)}.json`, keywordRecord[keyword])

  await storage.setItem(`keywords.json`, Object.keys(keywordRecord))

  // we'll create messages for batch processing the data fully
  return 'OK'
})
