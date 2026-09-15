import type { InjectionKey } from 'vue'
import { inject, reactive } from 'vue'

/**
 * The onboarding wizard's data layer as a swappable service, so the wizard +
 * step components stay dumb (render state, call methods — no RPC). The brand-kit
 * showcase drives the flow against `createInMemoryOnboardingService()`: it keeps
 * its own reactive state and resolves everything locally, so the whole wizard
 * runs e2e with zero network / no DB. The live app keeps its own RPC wiring; if
 * it ever adopts this seam it provides an RPC-backed impl of the same interface.
 *
 * Pure data shapes + an in-memory impl — no runtime services — so it's safe in
 * design-system and importable by brand-kit.
 */
export interface OnboardingSite {
  id: string
  url: string
}

export interface OnboardingInvite {
  email: string
  role: string
}

export interface OnboardingState {
  workspaceId: string | null
  workspaceName: string | null
  /** Selected "how can we help" intents (ids) + the free-text "other". */
  intents: string[]
  otherText: string
  sites: OnboardingSite[]
  connectedProviders: string[]
  invites: OnboardingInvite[]
}

export interface OnboardingService {
  readonly state: OnboardingState
  createWorkspace: (name: string) => Promise<{ id: string }>
  validateSite: (url: string) => Promise<{ valid: boolean, normalizedUrl?: string, error?: string }>
  addSites: (urls: string[]) => Promise<{ ids: string[] }>
  applyIntents: (intents: string[], otherText: string) => Promise<void>
  connectProvider: (provider: string, payload?: Record<string, unknown>) => Promise<void>
  isConnected: (provider: string) => boolean
  invite: (email: string, role: string) => Promise<void>
  finish: () => Promise<void>
}

export const ONBOARDING_SERVICE: InjectionKey<OnboardingService> = Symbol('onboarding-service')

/** Injected service, or `null` when not inside an onboarding wizard. */
export function useOnboardingService(): OnboardingService | null {
  return inject(ONBOARDING_SERVICE, null)
}

function emptyState(): OnboardingState {
  return { workspaceId: null, workspaceName: null, intents: [], otherText: '', sites: [], connectedProviders: [], invites: [] }
}

/**
 * In-memory implementation: mutates its own reactive state, no network. The
 * counter (not Math.random) keeps ids stable across SSR/hydration.
 */
export function createInMemoryOnboardingService(): OnboardingService {
  const state = reactive<OnboardingState>(emptyState())
  let seq = 0
  const nextId = (prefix: string) => `${prefix}_mock_${++seq}`

  return {
    state,
    async createWorkspace(name) {
      state.workspaceName = name
      state.workspaceId = nextId('team')
      return { id: state.workspaceId }
    },
    async validateSite(url) {
      const trimmed = url.trim()
      if (!trimmed)
        return { valid: false, error: 'Enter a URL' }
      return { valid: true, normalizedUrl: /^https?:\/\//.test(trimmed) ? trimmed : `https://${trimmed}` }
    },
    async addSites(urls) {
      const ids = urls.map((url) => {
        const id = nextId('site')
        state.sites.push({ id, url })
        return id
      })
      return { ids }
    },
    async applyIntents(intents, otherText) {
      state.intents = [...intents]
      state.otherText = otherText
    },
    async connectProvider(provider) {
      if (!state.connectedProviders.includes(provider))
        state.connectedProviders.push(provider)
    },
    isConnected(provider) {
      return state.connectedProviders.includes(provider)
    },
    async invite(email, role) {
      state.invites.push({ email, role })
    },
    async finish() {
      // no-op: the showcase flow ends in place rather than navigating away.
    },
  }
}
