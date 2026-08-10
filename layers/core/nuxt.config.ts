import { resolve } from 'node:path'

export default defineNuxtConfig({
  hooks: {
    'nitro:config': function (config) {
      config.typescript = config.typescript || {}
      config.typescript.tsConfig = config.typescript.tsConfig || {}
      config.typescript.tsConfig.include = config.typescript.tsConfig.include || []
      config.typescript.tsConfig.include.push(resolve(__dirname, './server/hooks.d.ts'))
    },
  },
})
