import { prefixStorage } from 'unstorage'

const storage = prefixStorage<{ urlOrTopic: string, payload: any, attempts: number }>(useStorage(), '.db/queue')

export default defineNitroPlugin((nitro) => {
  let nitroRunning = true
  nitro.hooks.hook('close', () => {
    nitroRunning = false
  })
  const promises: Promise<any>[] = []
  setTimeout(async () => {
    // eslint-disable-next-line no-unmodified-loop-condition
    while (nitroRunning) {
      // don't work if there are too many promises pending
      if (promises.filter(Boolean).length > 10)
        continue

      const nextKey = (await storage.getKeys()).pop()
      if (nextKey) {
        const message = (await storage.getItem(nextKey))!
        // the message should unqueue it
        // send message using a $fetch, json
        await storage.removeItem(nextKey, message)

        const promiseIndex = promises.push(new Promise((resolve) => {
          nitro.localFetch(message!.urlOrTopic, {
            body: message.payload,
            method: 'POST',
          })
            .then((res) => {
              resolve(res)
            })
            .finally(() => {
              // remove promise
              delete promises[promiseIndex]
            })
            .catch(async () => {
              message.attempts = message.attempts ? message.attempts + 1 : 1
              if (message.attempts < 3) {
                // update the message
                await storage.setItem(nextKey, message)
              }
              return false
            })
        }))
      }
      await new Promise(resolve => setTimeout(resolve, 1000))
    }
  }, 1000)
})
