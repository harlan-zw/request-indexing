export default defineEventHandler(async (e) => {
  await requireAdminAuth(e)
  const pool = createOAuthPool()
  const [usage, free] = await Promise.all([
    pool.usage(),
    pool.free(),
  ])
  return { usage, free }
})
