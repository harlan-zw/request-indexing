import type { ReceiverConfig } from '@upstash/qstash'
import { Client, Receiver } from '@upstash/qstash'
import type { H3Event } from 'h3'
import { defineMessageQueueDriver } from '.'

type ClientConstructorFirstArgument = ConstructorParameters<typeof Client>[0]

export default (config: { client: ClientConstructorFirstArgument, receiver: ReceiverConfig }) => {
  // create client
  const client = new Client(config.client)
  return defineMessageQueueDriver({
    message(json) {
      return client.publishJSON(json)
    },
    async receive(event: H3Event) {
      const r = new Receiver(config.receiver)
      const isValid = await r
        .verify({
          signature: getHeader(event, 'Upstash-Signature')!,
          body: (await readRawBody(event))!,
        })
        .catch((err: Error) => {
          console.error(err)
          return false
        })
      if (!isValid) {
        return sendError(event, createError({
          status: 401,
          statusText: 'Invalid signature',
        }))
      }
      return await readBody(event)
    },
  })
}
