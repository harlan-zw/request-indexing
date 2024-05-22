import type { Peer } from 'crossws'
import { getQuery } from 'ufo'
import { users } from '~/server/database/schema'

const wsHooks = new Map<string, () => void>()

export default defineWebSocketHandler({
  async open(peer) {
    const userId = getUserId(peer)
    // convert public id to user id
    const user = await useDrizzle().query.users.findFirst({
      where: eq(users.publicId, userId),
    })

    const nitro = useNitroApp()
    console.log('NEW WS CONNECTION', `ws:message:${user.publicId}`)
    wsHooks.set(userId, nitro.hooks.hook(`ws:message:${user.publicId}`, (message) => {
      console.log('Sending broadcast message to', peer, peer.readyState)
      const res = peer.send(JSON.stringify(message))
      console.log(res)
    }))
  },

  // TODO handle client -> server comms if needed
  // message(peer, message) {
  //
  // },

  close(peer) {
    const userId = getUserId(peer)
    if (wsHooks.has(userId)) {
      wsHooks.get(userId)?.()
      wsHooks.delete(userId)
    }
  },

  // error(peer, error) {
  //   console.log('[ws] error', peer, error)
  // },
})

function getUserId(peer: Peer) {
  const query = getQuery(peer.url)
  return query.userId as string
}
