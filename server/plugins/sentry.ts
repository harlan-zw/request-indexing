import { sentryCloudflareNitroPlugin } from '@sentry/nuxt/module/plugins'
import { createSentryDataCollection, dropExpectedNotFound, resolveSentryInitialization } from '../../shared/sentry'

export default defineNitroPlugin((nitroApp) => {
  const { sentry } = useRuntimeConfig().public
  const initialization = resolveSentryInitialization(sentry)
  if (initialization._tag === 'Disabled')
    return

  sentryCloudflareNitroPlugin({
    dsn: initialization.dsn,
    environment: initialization.environment,
    release: initialization.release,
    tracesSampleRate: sentry.tracesSampleRate,
    dataCollection: createSentryDataCollection(),
    beforeSend: dropExpectedNotFound,
  })(nitroApp)
})
