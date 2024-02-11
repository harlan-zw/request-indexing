import { getMetric } from '~/server/utils/storage'

export default defineEventHandler(async () => {
  const pool = createOAuthPool()
  return {
    signups: await getMetric('signups'),
    webIndexingApi: await pool.usage(),
  }
})
