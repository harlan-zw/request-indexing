import { addServerImports, addServerPlugin, createResolver, defineNuxtModule } from '@nuxt/kit'
import type { MessageQueueDrivers } from '../ttyl'

export interface ModuleOptions {
  devMessageQueue: {
    driver: MessageQueueDrivers
    [key: string]: any
  }
  messageQueue: {
    driver: MessageQueueDrivers
    [key: string]: any
  }
}

export default defineNuxtModule({
  meta: {
    name: 'nuxt-ttyl',
    configKey: 'messageQueue',
  },
  setup(config, nuxt) {
    const { resolve } = createResolver(import.meta.url)
    nuxt.options.alias = nuxt.options.alias || {}
    nuxt.options.alias.mq = resolve('../ttyl')
    // create a runtime virtual file in nitro
    nuxt.options.nitro.virtual = nuxt.options.nitro.virtual || {}
    nuxt.options.nitro.virtual['#nuxt-ttyl/virtual'] = () => {
      const mqConfig = (nuxt.options.dev ? config.devMessageQueue : config.messageQueue) || {}
      const driver = mqConfig?.driver || (nuxt.options.dev ? 'sync' : 'mock')
      console.log('got driver', driver)
      if (driver === 'unstorage') {
        const storageConfig = mqConfig.storage || {}
        let driverOptions = '{}'
        if (mqConfig.storage && Object.keys(mqConfig).length === 2) {
          driverOptions = `{ storage: unstorageDriver(${JSON.stringify({
            ...storageConfig,
            driver: undefined,
          })}) }`
        }
        else {
          // apply the storagconfig, need to cut off the last 2 chars and add dynamic string
          driverOptions = `${JSON.stringify({ ...mqConfig, storage: undefined }).slice(0, driverOptions.length - 2)}, storage: unstorageDriver(${JSON.stringify({
            ...storageConfig,
            driver: undefined,
          })}) }`
        }
        return `
        import { createMessageQueue } from 'mq'
        import driver from 'mq/drivers/unstorage'
        import unstorageDriver from 'unstorage/drivers/${storageConfig.driver}'

        export const mq = createMessageQueue({ driver: driver(${driverOptions}) })
      `
      }
      return `
        import { createMessageQueue } from 'mq'
        import driver from 'mq/drivers/${driver}'

        export const mq = createMessageQueue({ driver: driver(${JSON.stringify({ ...mqConfig, driver: undefined })}) })
      `
    }
    addServerImports([
      {
        name: 'useMessageQueue',
        from: resolve('./runtime/nitro/mq'),
      },
    ])

    if (nuxt.options.dev && config.devMessageQueue.driver === 'unstorage') {
      addServerPlugin(resolve('./runtime/nitro/plugin/unstorage'))
      // apply config
      nuxt.options.nitro.devStorage = nuxt.options.nitro.devStorage || {}
      nuxt.options.nitro.devStorage['.queue'] = {
        driver: 'fs',
        base: '.queue',
      }
    }
  },
})
