-- Backfill `teams.owner_id`, which is NULL for all 2570 rows in production.
--
-- The column was added after those teams were created and nothing ever
-- populated it. Every permission path that asks "is this caller the owner"
-- therefore answers no, including for a user's own personal team.
--
-- The mapping is unambiguous, verified against production before writing this:
--   2570 personal teams, 0 shared teams
--   0 teams referenced by more than one user's `current_team_id`
--   0 teams referenced by no user
-- So each team has exactly one user pointing at it, and that user is its owner.
--
-- Written as a targeted UPDATE rather than a table rebuild: SQLite can set a
-- nullable column in place, and rebuilding `users`/`teams` on D1 failed three
-- times on commit-time foreign key validation (see 0009's note).
--
-- Guarded with `WHERE owner_id IS NULL` so it is safe to re-run and cannot
-- overwrite an owner set by application code after this migration lands.

UPDATE `teams`
SET `owner_id` = (
	SELECT `u`.`user_id`
	FROM `users` AS `u`
	WHERE `u`.`current_team_id` = `teams`.`team_id`
)
WHERE `owner_id` IS NULL
	AND EXISTS (
		SELECT 1 FROM `users` AS `u` WHERE `u`.`current_team_id` = `teams`.`team_id`
	);
