export default defineNuxtConfig({
  extends: ['../../layers/core'],
  routeRules: {
    '/dashboard/**': { prerender: false },
    '/account/**': { prerender: false },
  },
})
