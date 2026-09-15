-- Scope site-address uniqueness to the team that owns the site.
--
-- 0014 moved `sites` onto team ownership but kept 0000's global unique index on
-- `domain`. `registerSite` pre-checks a duplicate by `(team_id, domain)`, so the
-- second team to connect any address passed that check and then hit a raw D1
-- constraint error: `POST /api/pro/sites` answered 500 and the onboarding
-- "Connect your sites" step could not be finished.
--
-- The global index also guarantees no duplicate domain exists yet, so swapping
-- it for the team-scoped one needs no data repair.
DROP INDEX `sites_domain_unique`;--> statement-breakpoint
CREATE UNIQUE INDEX `sites_team_id_domain_unique` ON `sites` (`team_id`,`domain`);
