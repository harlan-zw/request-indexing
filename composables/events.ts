import type { TaskMap } from '~/server/plugins/eventServiceProvider'

export function useJobListener<T extends keyof TaskMap>(name: T, callback: (payload: TaskMap[T]) => true | void) {
  // use nuxt hooks
  const nuxtApp = useNuxtApp()
  let _: () => void | undefined
  onMounted(() => {
    _ = nuxtApp.hooks.hook(`app:${name.replace('/', ':')}`, (ctx) => {
      if (callback(ctx))
        _()
    })
  })
  onUnmounted(() => {
    _?.()
  })
  return () => _?.()
}
