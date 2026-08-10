export default defineEventHandler(async (event) => {
  const { keywords } = await readBody(event)
  return fetchKeywordHistorialData(keywords)
})
