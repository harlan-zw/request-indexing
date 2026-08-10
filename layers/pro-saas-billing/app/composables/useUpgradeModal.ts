/**
 * Global upgrade-modal state. Components emit `upgradeRequested`; this composable
 * is the single consumer that opens <ProUpgradeModal> from anywhere on the dashboard.
 *
 * Form-data preservation: when a 409 STATE_CHANGED interrupts a write mid-form,
 * the interceptor calls `stashFormData(formId, data)` before opening the modal.
 * Data persists in localStorage so the user's input survives even if their tab
 * navigates while the modal is up.
 */

export type ProUpgradeReason
  = | 'sites_cap'
    | 'trial_paused'
    | 'read_only'
    | 'archived'
    | 'free_tier'
    | 'manual'

// Reason values the modal component understands (subset).
type ModalReason = 'sites_cap' | 'trial_paused' | 'read_only' | 'archived' | 'manual'

export interface UpgradeModalOptions {
  reason?: ProUpgradeReason
  suggestedTier?: 'pro' | 'growth' | 'scale'
  currentTier?: 'free' | 'pro' | 'growth' | 'scale' | null
  currentSitesLimit?: number
}

const FORM_STORAGE_PREFIX = 'pro:upgrade-stash:'

interface ModalState {
  open: boolean
  reason: ModalReason
  suggestedTier: 'pro' | 'growth' | 'scale'
  currentTier: 'free' | 'pro' | 'growth' | 'scale' | null
  currentSitesLimit?: number
}

function defaultState(): ModalState {
  return {
    open: false,
    reason: 'manual',
    suggestedTier: 'pro',
    currentTier: 'free',
    currentSitesLimit: undefined,
  }
}

function normalizeReason(reason: ProUpgradeReason | undefined): ModalReason {
  if (!reason || reason === 'free_tier' || reason === 'manual')
    return 'manual'
  return reason
}

// Backed by `useState('pro:upgrade-modal')` — globally shared by key, safe to
// call from `$fetch` interceptors and other non-setup contexts where `inject()`
// is unavailable.
export function useUpgradeModal() {
  const state = useState<ModalState>('pro:upgrade-modal', defaultState)

  function open(reason?: ProUpgradeReason, options?: Omit<UpgradeModalOptions, 'reason'>) {
    state.value = {
      open: true,
      reason: normalizeReason(reason),
      suggestedTier: options?.suggestedTier ?? 'pro',
      currentTier: options?.currentTier ?? null,
      currentSitesLimit: options?.currentSitesLimit,
    }
  }

  function close() {
    state.value = { ...state.value, open: false }
  }

  function setOpen(value: boolean) {
    if (value)
      state.value = { ...state.value, open: true }
    else
      close()
  }

  /**
   * Persist arbitrary form payload keyed by `formId`. Survives navigation +
   * page reload via localStorage. Use a stable key tied to the route + form
   * (e.g. `'sites-add:url'`) so the same form picks its data back up.
   */
  function stashFormData(formId: string, data: unknown) {
    if (!import.meta.client)
      return
    try {
      window.localStorage.setItem(FORM_STORAGE_PREFIX + formId, JSON.stringify(data))
    }
    catch {
      // Safe to ignore: localStorage throws in private mode or on quota — the
      // form just won't be restored after upgrade, which is acceptable.
    }
  }

  function readFormData<T = unknown>(formId: string): T | null {
    if (!import.meta.client)
      return null
    try {
      const raw = window.localStorage.getItem(FORM_STORAGE_PREFIX + formId)
      if (!raw)
        return null
      return JSON.parse(raw) as T
    }
    catch {
      return null
    }
  }

  function clearFormData(formId: string) {
    if (!import.meta.client)
      return
    try {
      window.localStorage.removeItem(FORM_STORAGE_PREFIX + formId)
    }
    catch {
      // Safe to ignore: localStorage throws in private mode; no-op is correct.
    }
  }

  return {
    state: readonly(state),
    isOpen: computed(() => state.value.open),
    reason: computed(() => state.value.reason),
    suggestedTier: computed(() => state.value.suggestedTier),
    currentTier: computed(() => state.value.currentTier),
    currentSitesLimit: computed(() => state.value.currentSitesLimit),
    open,
    close,
    setOpen,
    stashFormData,
    readFormData,
    clearFormData,
  }
}
