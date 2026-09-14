---
name: daily-checkin
description: Read requestindexing.com health and Sentry evidence in one daily check-in.
---

# Daily Check-in

Load the private token before running the shared CLI:

```sh
set -a
. "$HOME/.config/harlan-checkin/requestindexing.com.env"
set +a
pnpm checkin
```

Run from the repository root. Never print or commit the token.
Configure `CHECKIN_DEPLOYMENT`, `SENTRY_ORG=harlan-zw`, and `SENTRY_AUTH_TOKEN` externally.
The token authorizes only the read-only report. Keep existing admin authentication for admin operations.
Match `CHECKIN_DEPLOYMENT` to active Worker version metadata, not the latest CI commit.
The script combines the authenticated report and complete unresolved Sentry pagination.
Missing credentials, wrong deployment, missing checks, and stale reports remain unavailable.
Read severity and coverage together. Incomplete coverage never proves health.
Exit codes are 0 for complete passing evidence, 1 for warning or incomplete, and 2 for failure.

Check the existing admin jobs and OAuth endpoints when a result needs details.
Review gscdump connectivity and webhook evidence before attributing indexing failures to this site.
Never enable notifications or bulk sync during check-in. Preserve the current runtime gate.
An intentional pause is reported as evidence, not an outage.
No system-health email exists. Do not create one or send test messages.

Use the installed Sentry check-in triage skill for issue details and verified repairs.
Inspect release, URL, browser, affected users, and recurrence before classifying issues.
Do not resolve issues until the deployed repair is verified.
Open draft findings or repair PRs according to repository permissions.
Never deploy, mutate production data, or send messages without existing authorization.

The daily schedule keeps 06:00 Australia/Sydney after this draft merges.
No separate Sentry schedule is created.

The module discovers external checks in `checks/external` during preparation.
Keep required external IDs in `shared/checkin-external.ts`.
