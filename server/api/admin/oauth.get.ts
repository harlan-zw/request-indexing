import { authenticateAdmin } from '~/server/app/utils/auth'

export default defineEventHandler(async (e) => {
  await authenticateAdmin(e)
  const pool = createOAuthPool()
  const [usage, free] = await Promise.all([
    pool.usage(),
    pool.free(),
  ])
  return { usage, free }
})
