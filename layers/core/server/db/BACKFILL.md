# Database backfills

Three one-time backfills deferred from the integer-PK migration. Run as
individual SQL migrations against the live D1 binding before exposing the new
auth flow.

## 1. `users.api_key` for existing rows

Every user must have a non-null API key once the column is enforced. Generate
a 40-char nanoid per row.

```sql
-- pseudo: run via a one-off script that generates a fresh nanoid per row,
-- since SQLite has no nanoid() function.
UPDATE users SET api_key = $1 WHERE user_id = $2 AND api_key IS NULL;
```

## 2. `user_identities` from `users.sub`

For each existing user, seed one `user_identities` row corresponding to their
historical Google sign-in:

```sql
INSERT INTO user_identities (user_id, provider, provider_user_id, email, email_verified, display_name, avatar_url, linked_at, last_used_at)
SELECT user_id, 'google', sub, email, 1, name, avatar, unixepoch(), unixepoch()
FROM users
WHERE sub IS NOT NULL
ON CONFLICT (provider, provider_user_id) DO NOTHING;
```

## 3. v0-user grandfather (6 months)

All users created before the migration cutover get a 6-month complimentary Pro
window. Choose the cutover timestamp at deploy time.

```sql
UPDATE users
SET subscription_tier = 'pro',
    subscription_status = 'active',
    current_period_end = unixepoch('now', '+6 months')
WHERE created_at < $MIGRATION_TIMESTAMP
  AND (subscription_status IS NULL OR subscription_status = 'free');
```
