export default defineEventHandler(async (event) => {
  const { keyword } = getRouterParams(event, { decode: true })
  const gsc = await createGscClientFromEvent(event)
  return gsc.keyword(keyword)
})
