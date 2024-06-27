export default defineEventHandler(async (event) => {
  const { page } = getRouterParams(event, { decode: true })

  const gsc = await createGscClientFromEvent(event)
  return gsc.page(page)
})
