export default defineNuxtConfig({
  extends: ['../../layers/core'],
  routeRules: {
    '/admin/**': { robots: false, prerender: false },
  },
})
