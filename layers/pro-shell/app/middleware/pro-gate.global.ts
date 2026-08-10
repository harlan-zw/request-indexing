// Resolves pro-shell gating for the active route and writes the result to
// `useState('pro-gate')`. Never redirects; the locked shell renders inline so
// deep-links and SSR keep working. `ProSiteFeaturePage` reads this state to
// pick its chrome.
//
// Three authorization concepts per ADR-0025:
//   - subscription (CallerPlan) — typed plan check, also enforced server-side
//   - integration (IntegrationReadiness) — render directive, not enforced
//   - per-route requires — escape hatch for ad-hoc gates declared on a page

import { checkIntegration } from '../../shared/policies/integration-readiness'
import { useProFeatureRegistry } from '../composables/useProFeatureRegistry'
import { useProGateState } from '../composables/useProGateState'

export default defineNuxtRouteMiddleware((to) => {
  const meta = (to.meta ?? {}) as { pro?: { feature?: string } }
  const gate = useProGateState()
  gate.value = { blocked: false }

  if (!meta.pro?.feature)
    return

  const { getFeature } = useProFeatureRegistry()
  const feature = getFeature(meta.pro.feature)
  if (!feature)
    return

  const { caller, isPro } = useCaller()
  const { session } = useUserSession()

  // Subscription tier: typed CallerPlan. Today we only block the 'pro' tier;
  // when more tiers ship, extend this with a hierarchy comparison. The
  // server-side enforcement is `requireSubscription` on each handler — this
  // middleware is the UI mirror.
  if (feature.subscription === 'pro' && !isPro.value) {
    gate.value = {
      blocked: true,
      reason: `${feature.label} is a Pro feature.`,
      cta: { label: 'Upgrade', to: '/pro/pricing' },
    }
    return
  }

  // Integration readiness: render directive only. Handlers degrade to empty
  // data when the integration is missing; we just swap the body for a CTA.
  if (feature.integration) {
    const sessionState = session.value as { gscConnected?: boolean, gscIndexingScope?: boolean, gscSitemapsScope?: boolean } | undefined
    const gap = checkIntegration(feature.integration, {
      gscConnected: !!sessionState?.gscConnected,
      gscIndexingScope: !!sessionState?.gscIndexingScope,
      gscSitemapsScope: !!sessionState?.gscSitemapsScope,
    })
    if (gap) {
      gate.value = { blocked: true, reason: gap.reason, cta: gap.cta }
      // Avoid an unused-import warning; caller is used to drive `isPro` above
      // and may be read by future gate logic.
      void caller
    }
  }
})
