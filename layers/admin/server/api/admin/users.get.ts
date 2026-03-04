export default defineEventHandler(async (e) => {
  await requireAdminAuth(e)
  const db = useDrizzle()
  return db.query.users.findMany()
})
