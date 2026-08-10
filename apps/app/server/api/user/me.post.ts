// TODO(v1): re-implement user profile update. The previous implementation set
// dropped User columns (analyticsPeriod, analyticsRange).
export default defineEventHandler(() => {
  throw createError({ statusCode: 501, statusMessage: 'Not Implemented' })
})
