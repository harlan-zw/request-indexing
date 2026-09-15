import type { Ref } from 'vue'

export async function callFnSyncToggleRef<T extends () => unknown>(
  fn: T,
  toggleRef: Ref<boolean>,
  thresholdMs: number = 550,
): Promise<Awaited<ReturnType<T>>> {
  toggleRef.value = true
  return callFnDelayedResolve(fn, thresholdMs).finally(() => {
    toggleRef.value = false
  })
}

export async function callFnDelayedResolve<T extends () => unknown>(
  fn: T,
  thresholdMs: number = 550,
): Promise<Awaited<ReturnType<T>>> {
  const res = await Promise.all([
    fn(),
    new Promise(resolve => setTimeout(resolve, thresholdMs)),
  ])
  return res[0] as Awaited<ReturnType<T>>
}
