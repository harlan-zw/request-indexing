import { resolve } from 'path'
import { defineVitestConfig } from '@nuxt/test-utils/config'

process.env.NUXT_UI_PRO_LICENSE = 'AB481B21-8121-4854-B173-BCE42C5E543C'

export default defineVitestConfig({
  // any custom Vitest config you require
  test: {
    alias: {
      '#imports': resolve('./test/mocks/imports'),
    },
  },
})
