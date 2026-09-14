import { defineReportCheck } from '@harlan-zw/nuxt-checkin/external'

export default defineReportCheck({
  id: 'request-indexing.report',
  url: 'https://requestindexing.com/api/internal/checkin',
  tokenEnv: 'CHECKIN_TOKEN',
  deploymentEnv: 'CHECKIN_DEPLOYMENT',
  site: 'requestindexing.com',
  environment: 'production',
  required: ['request-indexing.database', 'request-indexing.integration'],
  maxAgeMs: 5 * 60_000,
})
