# Daily Check-in

The daily routine combines site checks and Sentry at 06:00 Australia/Sydney.
It replaces the existing Sentry routine and preserves its cadence and propose mode.

Site checks cover D1 readability and gscdump configuration. Intentional notification and bulk-sync pauses remain healthy evidence.
The authenticated admin route returns a versioned report with required IDs, identity, severity, and coverage.
The external caller checks freshness and deployment identity before accepting the report.
Missing credentials and missing evidence never prove health.

## Release

Keep this PR in draft until nuxt-checkin and the updated integration packages are published.
The intended versions are nuxt-checkin 0.1.0, nuxt-cloudflare 0.4.0, and nuxt-sentry 0.1.4.
Resolve released versions and regenerate pnpm-lock.yaml before making this draft ready.
Local verification uses built public package exports, without committed local package paths.
Deploy the report route before activating the updated routine.
Configure external credentials as described in the daily skill.
Never store admin cookies or Sentry tokens in the Worker or report evidence.

## Limits

This first adoption checks the existing site contracts listed above.
It does not prove every user workflow or upstream provider connection.
Check-in never sends emails, sync jobs, indexing requests, or feedback.
There is no existing system-health email to migrate.
The report deadline bounds waiting. Underlying reads may continue if their adapter cannot cancel.
No production query-cost improvement has been measured.
Verify deployed route authentication and live Sentry access before completing rollout.
