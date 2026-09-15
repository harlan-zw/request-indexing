export default defineNuxtConfig({
  extends: ['../../layers/core'],
  routeRules: {
    // The paid funnel's onboarding page was retired. Its URL still earns
    // traffic, so send it to the live onboarding route instead of a 404.
    '/pro/onboarding': { redirect: { to: '/pro/dashboard/team/setup', statusCode: 301 } },
  },
})
