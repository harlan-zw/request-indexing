import type { Peer } from 'crossws'
import { stringify } from 'devalue'
import { eq } from 'drizzle-orm'
import { getQuery } from 'ufo'
import { users } from '~~/layers/core/server/db/schema'

const wsHooks = new Map<string, () => void>()

export default defineWebSocketHandler({
  async open(peer) {
    const userId = getUserId(peer)
    // convert public id to user id
    const user = await useDrizzle().query.users.findFirst({
      where: eq(users.publicId, userId),
    })
    if (!user)
      return

    const nitro = useNitroApp()
    wsHooks.set(userId, (nitro.hooks as any).hook(`ws:message:${user.publicId}`, (message: unknown) => {
      peer.send(stringify(message))
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
  const query = getQuery((peer as any).url || '')
  return query.userId as string
}
