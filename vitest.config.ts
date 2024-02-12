import { defineVitestConfig } from '@nuxt/test-utils/config'

export default defineVitestConfig({
  // any custom Vitest config you require
  test: {

    watchExclude: ['.db/**', '.nuxt/**', '.saas'],
  },
})
