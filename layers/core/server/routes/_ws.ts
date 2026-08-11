import type { Peer } from 'crossws'
import { stringify } from 'devalue'
import { eq } from 'drizzle-orm'
import { getQuery } from 'ufo'
import { users } from '~~/layers/core/server/db/schema'

const wsHooks = new Map<number, () => void>()

export default defineWebSocketHandler({
  async open(peer) {
    const userId = getUserId(peer)
    // convert public id to user id
    const user = await useDrizzle().query.users.findFirst({
      where: eq(users.userId, userId),
    })
    if (!user)
      return

    const nitro = useNitroApp()
    const hook = nitro.hooks.hook as unknown as (name: `ws:message:${string}`, callback: (message: unknown) => void) => () => void
    wsHooks.set(userId, hook(`ws:message:${user.publicId}`, (message) => {
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
  const query = getQuery(peer.request.url || '')
  return Number(query.userId)
}
