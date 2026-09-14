import { defineExternalCheck, unavailable } from '@harlan-zw/nuxt-checkin/external'
import { defineSentryCheck } from '@harlan-zw/nuxt-sentry/checks'

export default defineExternalCheck({
  id: 'request-indexing.sentry',
  run(context) {
    if (!context.env.SENTRY_ORG)
      return unavailable('Sentry organization is required.')
    return defineSentryCheck({
      id: 'request-indexing.sentry',
      org: context.env.SENTRY_ORG,
      project: 'request-indexing',
      region: 'us',
    }).run(context)
  },
})
