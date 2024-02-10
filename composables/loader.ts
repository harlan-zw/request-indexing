import type { Ref } from 'vue'

export async function callFnSyncToggleRef<T extends (() => (Promise<any> | any))>(
  fn: T,
  toggleRef: Ref<boolean>,
  thresholdMs: number = 550,
): Promise<ReturnType<T>> {
  toggleRef.value = true
  return callFnDelayedResolve(fn, thresholdMs).finally(() => {
    toggleRef.value = false
  })
}

export async function callFnDelayedResolve<T extends (() => (Promise<any> | any))>(
  fn: T,
  thresholdMs: number = 550,
): Promise<ReturnType<T>> {
  const res = await Promise.all([
    fn(),
    new Promise(resolve => setTimeout(resolve, thresholdMs)),
  ])
  return Array.isArray(res) ? res[0] : res
}
