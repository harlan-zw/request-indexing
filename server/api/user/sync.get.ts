export default defineEventHandler(async (event) => {
  const { user } = event.context.authenticatedData

  const mq = useMessageQueue()
  // sync the selected sites
  await Promise.all(user.selectedSites.map(async (site) => {
    await mq.message(`/api/_mq/ingest/site/dates`, { user: { userId: user.userId }, site })
  }))

  return 'OK'
})
