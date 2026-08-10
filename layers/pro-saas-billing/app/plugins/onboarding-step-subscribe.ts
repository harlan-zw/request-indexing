/**
 * Registers the `subscribe` Onboarding Step owned by pro-saas.
 *
 * Predicate: `caller.subscription.status` is one of the live states (active, trial).
 * Anything else (`canceled`, `past_due`, null) means the user hasn't completed billing yet.
 */
export default defineNuxtPlugin({
  name: 'pro-saas:onboarding-step-subscribe',
  setup(nuxtApp) {
    nuxtApp.hook('pro:onboarding:step', (registry) => {
      registry.add({
        id: 'subscribe',
        title: 'Choose a plan',
        description: 'Pick a plan or start a free trial.',
        route: '/pro/onboarding',
        priority: 10,
        isComplete: ({ caller }) => {
          const status = caller.subscription.status
          return status === 'active' || status === 'trial'
        },
      })
    })
  },
})
