import type { ExternalOptions } from '@harlan-zw/nuxt-checkin/external'

export const externalCheckin = {
  identity: { site: 'requestindexing.com', environment: 'production', deploymentEnv: 'CHECKIN_DEPLOYMENT' },
  required: ['request-indexing.report', 'request-indexing.sentry'],
  credentials: { sentry: 'SENTRY_AUTH_TOKEN' },
  save: {
    dir: 'docs/ops/checkins',
    dirEnv: 'DAILY_CHECKIN_DIR',
    stateFile: 'state.json',
    timestampKey: 'lastRunAt',
    baseline: 'daily',
    defaultWindowMs: 86_400_000,
  },
  timeoutMs: 65000,
  totalTimeoutMs: 70000,
} satisfies ExternalOptions
