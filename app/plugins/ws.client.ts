import type { TaskMap } from '#shared/types/tasks'
import { parse } from 'devalue'

export default defineNuxtPlugin((nuxtApp) => {
  let ws: WebSocket | undefined
  const { user } = useUserSession()
  if (user.value) {
    connect(user.value as { userId: number, publicId: string })
  }
  else {
    watchOnce(user, (user) => {
      user && connect(user as unknown as { userId: number, publicId: string })
    })
  }
  async function connect(user: { userId: number, publicId: string }) {
    const isSecure = location.protocol === 'https:'
    const url = `${(isSecure ? 'wss://' : 'ws://') + location.host}/_ws?userId=${user.userId}`
    ws && ws.close()
    ws = new WebSocket(url)
    ws.addEventListener('message', (ctx) => {
      const job = parse(ctx.data) as { name: keyof TaskMap, payload: any }
      const payload = job.payload
      const hookName = `app:${(job.name as string).replace('/', ':')}`
      console.log('ws', hookName);
      (nuxtApp.hooks.callHook as Function)(hookName, payload)
      // console.log('ws message', job.name, payload)
      // if (job.name === 'users/syncGscSites') {
      //   totalSites.value = payload.totalSites
      //   if (isSetup.value) {
      //
      //   }
      //   isSetup.value = true
      // }
      // if (job.name === 'sites/setup') {
      //   if (payload.sites.length > 1)
      //     totalSites.value += payload.sites.length
      //   isSetup.value = true
      //   sitesSynced.value++
      // }
      // // TODO handle payload event
      // // const event = payload.event
      // refresh()
      // if (event === 'ingest/sites') {
      // }
      // console.log('[ws]', payload)
    })

    await new Promise(resolve => ws!.addEventListener('open', resolve))
  }
})
