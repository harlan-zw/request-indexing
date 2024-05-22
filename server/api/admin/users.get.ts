import { authenticateAdmin } from '~/server/app/utils/auth'

export default defineEventHandler(async (e) => {
  await authenticateAdmin(e)
  const db = useDrizzle()
  return db.query.users.findMany()
})
