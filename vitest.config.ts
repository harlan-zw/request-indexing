import { resolve } from 'path'
import { defineVitestConfig } from '@nuxt/test-utils/config'

export default defineVitestConfig({
  // any custom Vitest config you require
  test: {
    alias: {
      '#imports': resolve('./test/mocks/imports'),
    },
  },
})
