import type { TaskMap } from '#shared/types/tasks'

export function useJobListener<T extends keyof TaskMap>(name: T, callback: (payload: TaskMap[T]) => Promise<true | void> | true | void) {
  const nuxtApp = useNuxtApp()
  const registerHook = nuxtApp.hooks.hook as unknown as (
    name: string,
    callback: (payload: TaskMap[T]) => Promise<void> | void,
  ) => () => void
  let _: () => void | undefined
  onMounted(() => {
    const hookName = `app:${(name as string).replace('/', ':')}`
    _ = registerHook(hookName, async (ctx) => {
      if (await callback(ctx))
        _()
    })
  })
  onUnmounted(() => {
    _?.()
  })
  return () => _?.()
}
