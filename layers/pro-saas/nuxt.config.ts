// Pro SaaS layer: identity, teams.
// Owns user/team identity, Caller resolution, team policy, onboarding registry,
// feedback drawer, and shared pro primitives. Free-only beta: no billing layer.
// Pro layer (nuxt-seo-pro) consumes this layer's primitives.
//
// The `nuxt-notifications` module is auto-discovered from `modules/notifications/`
// at the project root. Configuration for it is owned here via the `notifications`
// configKey because pro-saas is the layer that depends on notification primitives.

import { defaultProSaasFeatures } from './shared/features'

export default defineNuxtConfig({
  appConfig: {
    proSaas: {
      features: defaultProSaasFeatures,
    },
  },
})
