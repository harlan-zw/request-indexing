/**
 * Provided service that collapses the cluster of pro-session composables
 * into a single shared instance. Mount once via the `pro-saas:session`
 * plugin so all pages share one `useCaller` fetch + sub-module state, and
 * leaf composables stop prop-drilling.
 */

import type { InjectionKey, Ref } from 'vue'
import type { Caller } from '../../shared/caller'

export type WorkspaceStatus = 'empty' | 'partial' | 'synced'

interface WorkspaceStatusApi {
  status: ComputedRef<WorkspaceStatus>
  sites: Ref<unknown>
}

interface ProSessionApi {
  caller: Ref<Caller | null>
  isAuthenticated: ComputedRef<boolean>
  isAdmin: ComputedRef<boolean>
  workspaceStatus: WorkspaceStatusApi
  refresh: () => Promise<void>
}

export const PRO_SESSION_KEY: InjectionKey<ProSessionApi> = Symbol('proSession')

function createWorkspaceStatus(): WorkspaceStatusApi {
  // Dashboard-state aggregation deferred to V1 site-overview rework. Until
  // that wires up, the workspace defaults to 'empty' so the shell renders
  // without a placeholder dashboard registry.
  const sites = ref<unknown[]>([])
  const status = computed<WorkspaceStatus>(() => 'empty')
  return { status, sites: sites as Ref<unknown> }
}

export function createProSession(): ProSessionApi {
  const callerComposable = useCaller()
  const isAuthenticated = computed(() => !!callerComposable.caller.value?.user)
  const isAdmin = computed(() => !!callerComposable.caller.value?.isAdmin)

  const api: ProSessionApi = {
    caller: callerComposable.caller as Ref<Caller | null>,
    isAuthenticated,
    isAdmin,
    workspaceStatus: createWorkspaceStatus(),
    refresh: async () => {
      await callerComposable.refresh()
    },
  }
  return api
}

// `inject` is a Vue reactivity-context API but the lint rule's allowlist omits it.

export function useProSession(): ProSessionApi {
  const injected = inject(PRO_SESSION_KEY, null)
  if (injected)
    return injected
  // Fallback: create a non-shared instance for tests or pages mounted outside
  // the pro-saas:session plugin. Production paths always hit the provider.
  return createProSession()
}
