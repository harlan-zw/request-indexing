import type { MessageQueue, MessageValue } from '../../../ttyl'
import { mq } from '#nuxt-ttyl/virtual'

export function useMessageQueue<T extends MessageValue = MessageValue>(): MessageQueue<T> {
  return mq
}
