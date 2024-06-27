import type { H3Event } from 'h3'

export interface MessageQueue<T extends MessageValue = MessageValue> {
  message: <U extends T>(urlOrTopic: string, json: U) => Promise<void>
  receive: <U extends T>(event: H3Event) => Promise<U>
}

export type MessageQueueDrivers = 'sync' | 'qstash'

export type MessageValue = Record<string, null | string | number | boolean | object>

// export interface MessageQueue<T extends MessageValue = MessageValue> {
//   message: <U extends T>(json: U) => Promise<void>
//   receive: <U extends T>(event: H3Event) => Promise<U>
// }

export function defineMessageQueueDriver(input: MessageQueue): MessageQueue {
  return input
}

export function createMessageQueue<T extends MessageValue = MessageValue>(options: { driver: MessageQueue<T> }): MessageQueue<T> {
  return defineMessageQueueDriver({
    message(urlOrTopic, json) {
      return options.driver.message(urlOrTopic, json)
    },
    async receive(event: H3Event) {
      return options.driver.receive(event)
    },
  })
}
