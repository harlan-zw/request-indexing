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
    wsHooks.set(userId, nitro.hooks.hook(`ws:message:${user.userId}`, (message) => {
      peer.send(JSON.stringify(message))
    }))
  },

  // TODO handle client -> server comms if needed
  // message(peer, message) {
  //
  // },

  close(peer) {
    const userId = getUserId(peer)
    wsHooks.get(userId)!()
    wsHooks.delete(userId)
  },

  // error(peer, error) {
  //   console.log('[ws] error', peer, error)
  // },
})

function getUserId(peer: Peer) {
  const query = getQuery(peer.url)
  return query.userId as string
}
