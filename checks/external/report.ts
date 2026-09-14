import { defineReportCheck } from '@harlan-zw/nuxt-checkin/external'

export default defineReportCheck({
  id: 'request-indexing.report',
  url: 'https://requestindexing.com/api/admin/daily-health',
  tokenEnv: 'CHECKIN_ADMIN_COOKIE',
  deploymentEnv: 'CHECKIN_DEPLOYMENT',
  site: 'requestindexing.com',
  environment: 'production',
  authHeader: 'Cookie',
  required: ['request-indexing.database', 'request-indexing.integration'],
  maxAgeMs: 5 * 60_000,
})
