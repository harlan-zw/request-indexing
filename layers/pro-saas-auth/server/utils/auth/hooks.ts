import type { AuthHooks } from '../../../shared/types/auth'
import { createHooks } from 'hookable'

// HMR safety: pin the hookable instance on globalThis so subscriber plugins
// registering across HMR reloads don't accumulate listeners on a stale bus.
const KEY = '__nuxtseo_auth_hooks__'

function getOrCreate(): ReturnType<typeof createHooks<AuthHooks>> {
  const g = globalThis as unknown as Record<string, ReturnType<typeof createHooks<AuthHooks>>>
  if (!g[KEY])
    g[KEY] = createHooks<AuthHooks>()
  return g[KEY]
}

export function useAuthHooks() {
  return getOrCreate()
}
