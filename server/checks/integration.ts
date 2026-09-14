import { defineCheck, pass, unavailable } from '@harlan-zw/nuxt-checkin/server'

export interface IntegrationState {
  notificationsEnabled: boolean
  gscdump: { apiKey: string, webhookSecret: string }
}

export default defineCheck<IntegrationState>({
  id: 'request-indexing.integration',
  run({ event }) {
    if (!event)
      return unavailable('Integration configuration is unavailable.')
    if (!event.gscdump.apiKey || !event.gscdump.webhookSecret)
      return unavailable('gscdump credentials are incomplete.')
    return pass({ configured: true, notificationsEnabled: event.notificationsEnabled, dailySyncPaused: !event.notificationsEnabled })
  },
})
