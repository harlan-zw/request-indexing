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
  prompts: [
    {
      id: 'site.collection-setup',
      prompt: `Before collection, load private credentials from $HOME/.config/harlan-checkin/requestindexing.com.env.
Never print or commit tokens.
Configure \`CHECKIN_DEPLOYMENT\`, \`SENTRY_ORG=harlan-zw\`, and \`SENTRY_AUTH_TOKEN\` externally.
The token authorizes only the read-only report. Keep existing admin authentication for admin operations.
Match \`CHECKIN_DEPLOYMENT\` to active Worker version metadata, not the latest CI commit.`,
    },
    {
      id: 'site.operations',
      prompt: `Check the existing admin jobs and OAuth endpoints when a result needs details.
Review gscdump connectivity and webhook evidence before attributing indexing failures to this site.
Never enable notifications or bulk sync during check-in. Preserve the current runtime gate.
An intentional pause is reported as evidence, not an outage.
No system-health email exists. Do not create one or send test messages.

Use the installed Sentry check-in triage skill for issue details and verified repairs.
Inspect release, URL, browser, affected users, and recurrence before classifying issues.
Do not resolve issues until the deployed repair is verified.
Record findings in the agent tracking report using the site, check ID, and stable cause.
Link known issues instead of proposing duplicate fixes. Return actionable repository fixes as Candidates for issue triage.
Keep credential and operational failures in the tracking report, with the next actor and required action.
Report recovery only after a fresh complete Pass from the expected deployment.
Keep checks and the CLI free of email or GitHub writes. The agent controller publishes the tracking report and Candidates.
Never deploy, mutate production data, or send messages without existing authorization.

Keep the daily schedule at 06:00 Australia/Sydney. Do not create a separate Sentry schedule.
The module discovers external checks in checks/external during preparation.
Keep required external IDs in shared/checkin-external.ts.`,
    },
  ],
  timeoutMs: 65000,
  totalTimeoutMs: 70000,
} satisfies ExternalOptions
