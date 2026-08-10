import type { GscdumpError } from '../composables/_gscdump-error'

// Module-scope dedup window so multiple useProGscdump() instances on the same
// page don't all fire their own toast for the same upstream failure.
const recentToasts = new Map<string, number>()
const TOAST_DEDUPE_MS = 5000

export function showGscdumpErrorToast(gscdumpError: GscdumpError) {
  if (import.meta.server)
    return

  const key = `${gscdumpError.code}:${gscdumpError.message}`
  const now = Date.now()

  if (recentToasts.has(key) && now - recentToasts.get(key)! < TOAST_DEDUPE_MS)
    return
  recentToasts.set(key, now)

  for (const [k, v] of recentToasts) {
    if (now - v > TOAST_DEDUPE_MS)
      recentToasts.delete(k)
  }

  const nuxtApp = useNuxtApp()
  nuxtApp.runWithContext(() => {
    const toast = useToast()
    toast.add({
      title: 'Data Loading Error',
      description: gscdumpError.message,
      color: gscdumpError.code === 'AUTH' ? 'warning' : 'error',
      icon: gscdumpError.code === 'NETWORK' ? 'i-lucide-wifi-off' : 'i-lucide-alert-circle',
    })
  })
}
