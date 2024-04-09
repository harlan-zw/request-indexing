import type { H3Event } from 'h3'
import { createConsola } from 'consola'
import { defineMessageQueueDriver } from '../'

const messages = new Map<string, any[]>()

export default (options: { debug: boolean }) => {
  const logger = createConsola({
    level: options.debug ? 5 : 3,
  })
  // create client
  return defineMessageQueueDriver({
    async message(urlOrTopic, json) {
      const queue = messages.get(urlOrTopic) || []
      queue.push(json)
      messages.set(urlOrTopic, queue)
      logger.info('Message sent to', urlOrTopic)
      return Promise.resolve()
    },
    async receive(event: H3Event) {
      const key = getRequestURL(event, { xForwardedHost: true, xForwardedProto: true }).toString()
      const queue = messages.get(key) || []
      // pop the first message
      const message = queue.shift()
      messages.set(key, queue)
      logger.info('Received message sent to', key)
      return message
    },
  })
}
