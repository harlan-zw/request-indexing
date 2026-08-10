/**
 * Registers the `connect-gsc` Onboarding Step owned by pro-gsc.
 *
 * Predicate: at least one of the Caller's sites is matched to a GSC property.
 * Optional: users can skip and connect later from `/pro/dashboard/search-console`.
 */
export default defineNuxtPlugin({
  name: 'pro-gsc:onboarding-step-connect-gsc',
  setup(nuxtApp) {
    nuxtApp.hook('pro:onboarding:step', (registry) => {
      registry.add({
        id: 'connect-gsc',
        title: 'Connect Google Search Console',
        description: 'Enable query, page, and indexing data for your sites.',
        route: '/pro/dashboard/search-console',
        priority: 30,
        optional: true,
        isComplete: ({ gscConnected }) => gscConnected,
      })
    })
  },
})
