import { sentryCloudflareNitroPlugin } from '@sentry/nuxt/module/plugins'
import { createSentryDataCollection, dropExpectedNotFound, resolveServerSentryInitialization } from '../../shared/sentry'

export default defineNitroPlugin((nitroApp) => {
  const { sentry } = useRuntimeConfig()
  const initialization = resolveServerSentryInitialization(sentry)
  if (initialization._tag === 'Disabled')
    return

  sentryCloudflareNitroPlugin({
    dsn: initialization.dsn,
    environment: sentry.environment,
    release: initialization.release,
    tracesSampleRate: sentry.tracesSampleRate,
    dataCollection: createSentryDataCollection(),
    beforeSend: dropExpectedNotFound,
  })(nitroApp)
})
