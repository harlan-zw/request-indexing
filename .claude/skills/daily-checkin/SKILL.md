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
export DAILY_CHECKIN_DIR="${DAILY_CHECKIN_DIR:-${XDG_STATE_HOME:-$HOME/.local/state}/daily-checkin/harlan-zw/request-indexing}"
pnpm checkin
```

Keep the archive and state outside disposable worktrees.
Complete reports advance the daily baseline, including warnings and failures.
Incomplete coverage never advances it. The first run uses a 24-hour window.

Run from the repository root. Never print or commit the token.
Configure `CHECKIN_DEPLOYMENT`, `SENTRY_ORG=harlan-zw`, and `SENTRY_AUTH_TOKEN` externally.
The token authorizes only the read-only report. Keep existing admin authentication for admin operations.
Match `CHECKIN_DEPLOYMENT` to active Worker version metadata, not the latest CI commit.
The script combines the authenticated report and complete unresolved Sentry pagination.
Missing credentials, wrong deployment, missing checks, and stale reports remain unavailable.
Read severity separately from coverage. Incomplete coverage never proves health.
Exit 0 means complete passing evidence. Exit 1 means warnings or failures. Exit 2 means incomplete coverage.
Read every result. Keep Fail and Warn visible when coverage is incomplete.

Check the existing admin jobs and OAuth endpoints when a result needs details.
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

The daily schedule keeps 06:00 Australia/Sydney after this draft merges.
No separate Sentry schedule is created.

The module discovers external checks in `checks/external` during preparation.
Keep required external IDs in `shared/checkin-external.ts`.
