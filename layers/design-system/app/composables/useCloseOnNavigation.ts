import type { WatchSource, WatchStopHandle } from 'vue'
import { watch } from 'vue'

/** Close persistent overlay state after a confirmed client route change. */
export function useCloseOnNavigation(fullPath: WatchSource<string>, close: () => void): WatchStopHandle {
  return watch(fullPath, close)
}
