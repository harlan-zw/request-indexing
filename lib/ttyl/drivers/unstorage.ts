import type { H3Event } from 'h3'
import { createConsola } from 'consola'
import type { Driver } from 'unstorage'
import { createStorage } from 'unstorage'
import { hash } from 'ohash'
import { defineMessageQueueDriver } from '../'

export default (options: { debug: boolean, storage: Driver }) => {
  const logger = createConsola({
    level: options.debug ? 5 : 3,
  })
  const storage = createStorage<{ urlOrTopic: string, payload: any }>()
  storage.mount('.queue', options.storage)
  // create client
  return defineMessageQueueDriver({
    async message(urlOrTopic, payload) {
      const message: any = { urlOrTopic, payload, createdAt: Date.now() }
      message.taskId = hash(message)
      logger.info('queued message', message.taskId, message.urlOrTopic, message.payload)
      await storage.setItem(`.queue:${message.taskId}.json`, message)
    },
    async receive(event: H3Event) {
      const message = await readBody(event)
      const storedMessage = storage.getItem(`.queue:${message.taskId}`)
      // check the item exists
      if (!storedMessage || message.taskId !== storedMessage.taskId) {
        return sendError(event, createError({
          status: 404,
          statusText: 'Not found',
        }))
      }
      // await storage.removeItem(message.taskId)
      return message
    },
  })
}
