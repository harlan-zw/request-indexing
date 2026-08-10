/**
 * Provide a single shared ProSession at the app root so every page/component
 * shares one `useCaller` fetch + sub-module instance instead of each leaf
 * composable re-fetching or maintaining duplicate state.
 */
export default defineNuxtPlugin({
  name: 'pro-saas:session',
  setup(nuxtApp) {
    nuxtApp.vueApp.provide(PRO_SESSION_KEY, createProSession())
  },
})
