import * as Sentry from '@sentry/nuxt'
import { useRuntimeConfig } from '#imports'
import { createSentryDataCollection, dropExpectedNotFound } from './shared/sentry'

// The module wraps this file in a Nuxt plugin, so runtime config is available
// here. Read the same decision the Nitro plugin reads: `import.meta.dev` alone
// is false inside a local `wrangler dev` worker, which is how a laptop ended up
// reporting as production.
const { sentry } = useRuntimeConfig().public

if (sentry.enabled && sentry.dsn) {
  Sentry.init({
    dsn: sentry.dsn,
    environment: sentry.environment,
    release: sentry.release || undefined,
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
