export default defineNuxtConfig({
  extends: [
    '../../layers/design-system',
    '../../layers/core',
  ],
  routeRules: {
    '/kit/**': { robots: false, prerender: false },
  },
})
