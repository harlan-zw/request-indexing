import { sentryCloudflareNitroPlugin } from '@sentry/nuxt/module/plugins'
import { createSentryDataCollection } from '../../shared/sentry'

export default defineNitroPlugin((nitroApp) => {
  const { sentry } = useRuntimeConfig()
  if (!sentry.enabled || !sentry.dsn)
    return

  sentryCloudflareNitroPlugin({
    dsn: sentry.dsn,
    environment: sentry.environment,
    release: sentry.release || undefined,
    tracesSampleRate: sentry.tracesSampleRate,
    dataCollection: createSentryDataCollection(),
  })(nitroApp)
})
