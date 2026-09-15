# Recheck article examples

This unpublished harness extracts the actual JavaScript fences. It does not keep duplicate example files.
Run from the repository root with Node.js 24.18.0 and pnpm (verified with 12.3.4):

```bash
article_check_dir=$(mktemp -d "$HOME/scratch/request-indexing-examples.XXXXXX")
pnpm --dir "$article_check_dir" add --ignore-scripts googleapis@181.0.0 nock@14.0.17
node apps/marketing/content/editorial/examples-check/check.mjs "$article_check_dir"
printf 'Evidence directory: %s\n' "$article_check_dir"
```

Installation downloads packages. The subsequent checks disable network access in each example process.
The app dependency graph stays unchanged. Temporary examples and dependencies stay in the printed scratch directory.

Checks cover publish URL, POST body, authorization header, observed auth scope, success, structured failure, mixed sequential results, deduplication, and metadata.
The metadata check executes the extracted metadata fence with client setup from the main example.
Each child has a ten-second timeout. Tutorial and Node notification fences must match.

Google credentials and responses are mocked. Passing proves request construction and local handling only.
It does not prove authentication, ownership, quota accounting, indexing, or multipart parsing.
If the article structure changes, update extraction deliberately and review the new evidence.
