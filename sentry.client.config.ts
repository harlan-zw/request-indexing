import * as Sentry from '@sentry/nuxt'
import { createSentryDataCollection, dropExpectedNotFound, SENTRY_DSN } from './shared/sentry'

if (!import.meta.dev) {
  Sentry.init({
    dsn: SENTRY_DSN,
    environment: 'production',
    tracesSampleRate: 0.05,
    dataCollection: createSentryDataCollection(),
    beforeSend: dropExpectedNotFound,
    ignoreErrors: [
      /Failed to fetch dynamically imported module/i,
      /Importing a module script failed/i,
      /error loading dynamically imported module/i,
    ],
  })
}
