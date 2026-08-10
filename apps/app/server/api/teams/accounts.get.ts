// TODO(v1): re-implement team accounts listing once V1 team shape is settled.
export default defineEventHandler(() => {
  throw createError({ statusCode: 501, statusMessage: 'Not Implemented' })
})
