import { authenticateUser } from '~/server/app/utils/auth'

export default defineEventHandler(async (event) => {
  const user = await authenticateUser(event)

  if (!user.gscdumpUserId || !user.gscdumpApiKey) {
    throw createError({ statusCode: 404, message: 'gscdump not configured for this user' })
  }

  return {
    apiKey: user.gscdumpApiKey,
    userId: user.gscdumpUserId,
    apiUrl: 'https://gscdump.com/api',
  }
})
