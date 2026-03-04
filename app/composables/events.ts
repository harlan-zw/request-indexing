import type { TaskMap } from '#shared/types/tasks'

export function useJobListener<T extends keyof TaskMap>(name: T, callback: (payload: TaskMap[T]) => true | void) {
  const nuxtApp = useNuxtApp()
  let _: () => void | undefined
  onMounted(() => {
    const hookName = `app:${(name as string).replace('/', ':')}`
    _ = (nuxtApp.hooks.hook as Function)(hookName, (ctx: TaskMap[T]) => {
      if (callback(ctx))
        _()
    })
  })
  onUnmounted(() => {
    _?.()
  })
  return () => _?.()
}
