// import type { Queue } from '@cloudflare/workers-types'
// import { defineMessageQueueDriver } from '../'
//
// function getQueueBinding(name: string): Queue {
//   // @ts-expect-error globalThis.__env__ is injected by the runtime
//   return process.env[name] || globalThis.__env__?.[name] || globalThis[name]
// }
//
// export default (config: { binding: string, queue: string }) => {
//   return defineMessageQueueDriver({
//     message(path, payload) {
//       // isn't available straight away
//       const binding = getQueueBinding(config.binding)
//       console.log('got binding', binding, config.binding, globalThis.__env__?.DEV_QUEUE)
//       return binding.send({ path, payload }, {
//         // delaySeconds: 0,
//       })
//       // sendBatch
//     },
//     // async receive() {
//     //   // const r = new Receiver(config.receiver)
//     //   // const isValid = await r
//     //   //   .verify({
//     //   //     signature: getHeader(event, 'Upstash-Signature')!,
//     //   //     body: (await readRawBody(event))!,
//     //   //   })
//     //   //   .catch((err: Error) => {
//     //   //     console.error(err)
//     //   //     return false
//     //   //   })
//     //   // if (!isValid) {
//     //   //   return sendError(event, createError({
//     //   //     status: 401,
//     //   //     statusText: 'Invalid signature',
//     //   //   }))
//     //   // }
//     //   // return await readBody(event)
//     // },
//   })
// }
