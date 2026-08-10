// Pro SaaS Auth layer: identity, OAuth, account linking, hook bus.
// Owns user_identities, the OAuth route, login UI, and the typed hook bus.
// Integrations (GSC tokens, Discord, github org-invite) stay in their feature
// layers. See google-signin-plan.md (Rounds 4-9) + ADR-NNNN.
//
// This layer opts OUT of contributing to global auto-import. Components and
// composables defined here MUST be imported explicitly.
export default defineNuxtConfig({
  components: [],
  imports: {
    dirs: [],
  },
})
