import * as Sentry from '@sentry/nuxt'
import { useRuntimeConfig } from '#imports'
import { createSentryDataCollection, dropExpectedNotFound, resolveSentryInitialization } from './shared/sentry'

// The Sentry module wraps this file in a Nuxt plugin, so runtime config is
// readable here. Read the same decision the Nitro plugin reads instead of
// `import.meta.dev`, which is false inside a local `wrangler dev` worker.
const { sentry } = useRuntimeConfig().public
const initialization = resolveSentryInitialization(sentry)

if (initialization._tag === 'Enabled') {
  Sentry.init({
    dsn: initialization.dsn,
    environment: initialization.environment,
    release: initialization.release,
    tracesSampleRate: sentry.tracesSampleRate,
    dataCollection: createSentryDataCollection(),
    beforeSend: dropExpectedNotFound,
    ignoreErrors: [
      /Failed to fetch dynamically imported module/i,
      /Importing a module script failed/i,
      /error loading dynamically imported module/i,
    ],
  })
}
