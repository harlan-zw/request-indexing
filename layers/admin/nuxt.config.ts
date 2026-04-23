export default defineNuxtConfig({
  routeRules: {
    '/admin/**': { robots: false, prerender: false },
  },
})
