-- Move `sites` onto nuxtseo.com's identity and ownership model.
--
-- Three changes, one rebuild:
--   1. `sites.site_id` (autoincrement integer) becomes `sites.id`, a text UUID.
--   2. `sites.public_id` gains the `s_` prefix nuxtseo.com puts in its URLs.
--      The existing nanoid tail is kept, so a bookmarked public id still
--      resolves once the boundary normalises a missing prefix.
--   3. `sites.team_id` is added NOT NULL. Team is now the single ownership
--      axis; `owner_id` stays as creator attribution only.
--
-- Every child `site_id` moves to text through `_site_id_map`. The four legacy
-- v0 analytics tables are dropped rather than rebuilt: nothing outside the
-- retired `/dashboard/site/:slug` tree reads them, and gscdump owns that data
-- now.
--
-- The rebuild order exists to keep SQLite's immediate foreign keys satisfied
-- at every step, because a D1 rebuild that relies on `defer_foreign_keys`
-- has failed here before (see 0009). Children are staged into constraint-free
-- tables first, so nothing references `sites` when it is dropped, and the
-- self-referencing `parent_id` is filled in after the rename.

CREATE TABLE `_site_id_map` (
	`old_id` integer PRIMARY KEY NOT NULL,
	`new_id` text NOT NULL
);--> statement-breakpoint

INSERT INTO `_site_id_map` (`old_id`, `new_id`)
SELECT `site_id`,
	lower(hex(randomblob(4))) || '-'
	|| lower(hex(randomblob(2))) || '-4'
	|| substr(lower(hex(randomblob(2))), 2) || '-'
	|| substr('89ab', abs(random()) % 4 + 1, 1)
	|| substr(lower(hex(randomblob(2))), 2) || '-'
	|| lower(hex(randomblob(6)))
FROM `sites`;--> statement-breakpoint

CREATE TABLE `_site_parent_map` (
	`child_new_id` text NOT NULL,
	`parent_new_id` text NOT NULL
);--> statement-breakpoint

INSERT INTO `_site_parent_map` (`child_new_id`, `parent_new_id`)
SELECT `c`.`new_id`, `p`.`new_id`
FROM `sites` AS `s`
JOIN `_site_id_map` AS `c` ON `c`.`old_id` = `s`.`site_id`
JOIN `_site_id_map` AS `p` ON `p`.`old_id` = `s`.`parent_id`
WHERE `s`.`parent_id` IS NOT NULL;--> statement-breakpoint

-- Onboarding completion moves from `teams.onboarded_step` to the user. A team
-- that finished onboarding means its members' owner finished it.
UPDATE `users`
SET `onboarding_completed_at` = unixepoch()
WHERE `onboarding_completed_at` IS NULL
	AND EXISTS (
		SELECT 1 FROM `teams` AS `t`
		WHERE `t`.`team_id` = `users`.`current_team_id`
			AND `t`.`onboarded_step` IS NOT NULL
	);--> statement-breakpoint

-- Legacy v0 analytics. Dropped, not migrated.
DROP TABLE IF EXISTS `site_path_date_analytics`;--> statement-breakpoint
DROP TABLE IF EXISTS `site_date_country_analytics`;--> statement-breakpoint
DROP TABLE IF EXISTS `site_date_analytics`;--> statement-breakpoint
DROP TABLE IF EXISTS `site_paths`;--> statement-breakpoint

-- Stage every surviving child with the mapped text id and no constraints, so
-- nothing references `sites` while it is replaced.
CREATE TABLE `_stage_usages` (`site_id` text NOT NULL, `date` text NOT NULL, `key` text NOT NULL, `usage` integer NOT NULL);--> statement-breakpoint
INSERT INTO `_stage_usages` SELECT `m`.`new_id`, `u`.`date`, `u`.`key`, `u`.`usage` FROM `usages` AS `u` JOIN `_site_id_map` AS `m` ON `m`.`old_id` = `u`.`site_id`;--> statement-breakpoint
DROP TABLE `usages`;--> statement-breakpoint

CREATE TABLE `_stage_user_sites` (`user_id` integer NOT NULL, `site_id` text NOT NULL, `permission_level` text);--> statement-breakpoint
INSERT INTO `_stage_user_sites` SELECT `x`.`user_id`, `m`.`new_id`, `x`.`permission_level` FROM `user_sites` AS `x` JOIN `_site_id_map` AS `m` ON `m`.`old_id` = `x`.`site_id`;--> statement-breakpoint
DROP TABLE `user_sites`;--> statement-breakpoint

CREATE TABLE `_stage_team_sites` (`team_id` integer NOT NULL, `site_id` text NOT NULL, `google_account_id` integer NOT NULL);--> statement-breakpoint
INSERT INTO `_stage_team_sites` SELECT `x`.`team_id`, `m`.`new_id`, `x`.`google_account_id` FROM `team_sites` AS `x` JOIN `_site_id_map` AS `m` ON `m`.`old_id` = `x`.`site_id`;--> statement-breakpoint

CREATE TABLE `_stage_indexing_jobs` (`indexing_job_id` integer, `site_id` text NOT NULL, `path` text NOT NULL, `transport` text NOT NULL, `state` text NOT NULL, `attempts` integer NOT NULL, `last_error` text, `submitted_at` integer, `created_at` integer, `updated_at` integer);--> statement-breakpoint
INSERT INTO `_stage_indexing_jobs` SELECT `x`.`indexing_job_id`, `m`.`new_id`, `x`.`path`, `x`.`transport`, `x`.`state`, `x`.`attempts`, `x`.`last_error`, `x`.`submitted_at`, `x`.`created_at`, `x`.`updated_at` FROM `indexing_jobs` AS `x` JOIN `_site_id_map` AS `m` ON `m`.`old_id` = `x`.`site_id`;--> statement-breakpoint
DROP TABLE `indexing_jobs`;--> statement-breakpoint

CREATE TABLE `_stage_indexing_investigations` (`indexing_investigation_id` integer, `site_id` text NOT NULL, `url` text NOT NULL, `issue_type` text NOT NULL, `status` text NOT NULL, `note` text, `investigated_at` integer);--> statement-breakpoint
INSERT INTO `_stage_indexing_investigations` SELECT `x`.`indexing_investigation_id`, `m`.`new_id`, `x`.`url`, `x`.`issue_type`, `x`.`status`, `x`.`note`, `x`.`investigated_at` FROM `indexing_investigations` AS `x` JOIN `_site_id_map` AS `m` ON `m`.`old_id` = `x`.`site_id`;--> statement-breakpoint
DROP TABLE `indexing_investigations`;--> statement-breakpoint

-- `team_id` comes from the existing `team_sites` link, then the owner's
-- personal team, then the owner's current team. A site that resolves to none
-- of those has no reachable owner and is dropped with the old table.
CREATE TABLE `_stage_sites` (
	`id` text NOT NULL,
	`public_id` text NOT NULL,
	`team_id` integer NOT NULL,
	`property` text NOT NULL,
	`active` integer NOT NULL,
	`sitemaps` text,
	`domain` text,
	`last_synced` integer,
	`is_synced` integer,
	`owner_id` integer,
	`gscdump_site_id` text,
	`gscdump_site_url` text,
	`gscdump_sync_status` text,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);--> statement-breakpoint

INSERT INTO `_stage_sites`
SELECT
	`m`.`new_id`,
	's_' || `s`.`public_id`,
	COALESCE(
		(SELECT `ts`.`team_id` FROM `_stage_team_sites` AS `ts` WHERE `ts`.`site_id` = `m`.`new_id` LIMIT 1),
		(SELECT `t`.`team_id` FROM `teams` AS `t` WHERE `t`.`owner_id` = `s`.`owner_id` AND `t`.`personal_team` = 1 LIMIT 1),
		(SELECT `u`.`current_team_id` FROM `users` AS `u` WHERE `u`.`user_id` = `s`.`owner_id`)
	),
	`s`.`property`, `s`.`active`, `s`.`sitemaps`, `s`.`domain`,
	`s`.`last_synced`, `s`.`is_synced`, `s`.`owner_id`, `s`.`gscdump_site_id`,
	`s`.`gscdump_site_url`, `s`.`gscdump_sync_status`, `s`.`created_at`, `s`.`updated_at`
FROM `sites` AS `s`
JOIN `_site_id_map` AS `m` ON `m`.`old_id` = `s`.`site_id`
WHERE COALESCE(
	(SELECT `ts`.`team_id` FROM `_stage_team_sites` AS `ts` WHERE `ts`.`site_id` = `m`.`new_id` LIMIT 1),
	(SELECT `t`.`team_id` FROM `teams` AS `t` WHERE `t`.`owner_id` = `s`.`owner_id` AND `t`.`personal_team` = 1 LIMIT 1),
	(SELECT `u`.`current_team_id` FROM `users` AS `u` WHERE `u`.`user_id` = `s`.`owner_id`)
) IS NOT NULL;--> statement-breakpoint

DROP TABLE `team_sites`;--> statement-breakpoint
-- The old table goes before the new one is created, so the self-referencing
-- `parent_id` foreign key resolves against the table it is declared in rather
-- than the integer-keyed table it replaces.
DROP TABLE `sites`;--> statement-breakpoint

CREATE TABLE `sites` (
	`id` text PRIMARY KEY NOT NULL,
	`public_id` text NOT NULL,
	`team_id` integer NOT NULL,
	`property` text NOT NULL,
	`active` integer DEFAULT false NOT NULL,
	`sitemaps` text,
	`domain` text,
	`parent_id` text,
	`last_synced` integer,
	`is_synced` integer DEFAULT false,
	`owner_id` integer,
	`gscdump_site_id` text,
	`gscdump_site_url` text,
	`gscdump_sync_status` text,
	`created_at` integer DEFAULT (CURRENT_TIMESTAMP) NOT NULL,
	`updated_at` integer DEFAULT (CURRENT_TIMESTAMP) NOT NULL,
	FOREIGN KEY (`team_id`) REFERENCES `teams`(`team_id`) ON UPDATE no action ON DELETE restrict,
	FOREIGN KEY (`parent_id`) REFERENCES `sites`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`owner_id`) REFERENCES `users`(`user_id`) ON UPDATE no action ON DELETE no action
);--> statement-breakpoint

INSERT INTO `sites` (
	`id`, `public_id`, `team_id`, `property`, `active`, `sitemaps`, `domain`,
	`parent_id`, `last_synced`, `is_synced`, `owner_id`, `gscdump_site_id`,
	`gscdump_site_url`, `gscdump_sync_status`, `created_at`, `updated_at`
)
SELECT `id`, `public_id`, `team_id`, `property`, `active`, `sitemaps`, `domain`,
	NULL, `last_synced`, `is_synced`, `owner_id`, `gscdump_site_id`,
	`gscdump_site_url`, `gscdump_sync_status`, `created_at`, `updated_at`
FROM `_stage_sites`;--> statement-breakpoint
DROP TABLE `_stage_sites`;--> statement-breakpoint
CREATE INDEX `sites_team_idx` ON `sites` (`team_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `sites_domain_unique` ON `sites` (`domain`);--> statement-breakpoint
CREATE UNIQUE INDEX `sites_public_id_unique` ON `sites` (`public_id`);--> statement-breakpoint

-- Split-domain parents exist now, so the self reference can be restored.
UPDATE `sites`
SET `parent_id` = (SELECT `p`.`parent_new_id` FROM `_site_parent_map` AS `p` WHERE `p`.`child_new_id` = `sites`.`id`)
WHERE EXISTS (
	SELECT 1 FROM `_site_parent_map` AS `p`
	WHERE `p`.`child_new_id` = `sites`.`id`
		AND `p`.`parent_new_id` IN (SELECT `id` FROM `sites`)
);--> statement-breakpoint

CREATE TABLE `usages` (
	`site_id` text NOT NULL,
	`date` text NOT NULL,
	`key` text NOT NULL,
	`usage` integer DEFAULT 0 NOT NULL,
	FOREIGN KEY (`site_id`) REFERENCES `sites`(`id`) ON UPDATE no action ON DELETE no action
);--> statement-breakpoint
INSERT INTO `usages` SELECT * FROM `_stage_usages` WHERE `site_id` IN (SELECT `id` FROM `sites`);--> statement-breakpoint
DROP TABLE `_stage_usages`;--> statement-breakpoint
CREATE UNIQUE INDEX `usages_site_id_date_key_unique` ON `usages` (`site_id`,`date`,`key`);--> statement-breakpoint

CREATE TABLE `user_sites` (
	`user_id` integer NOT NULL,
	`site_id` text NOT NULL,
	`permission_level` text,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`user_id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`site_id`) REFERENCES `sites`(`id`) ON UPDATE no action ON DELETE no action
);--> statement-breakpoint
INSERT INTO `user_sites` SELECT * FROM `_stage_user_sites` WHERE `site_id` IN (SELECT `id` FROM `sites`);--> statement-breakpoint
DROP TABLE `_stage_user_sites`;--> statement-breakpoint
CREATE UNIQUE INDEX `user_sites_user_id_site_id_unique` ON `user_sites` (`user_id`,`site_id`);--> statement-breakpoint

CREATE TABLE `team_sites` (
	`team_id` integer NOT NULL,
	`site_id` text NOT NULL,
	`google_account_id` integer NOT NULL,
	FOREIGN KEY (`team_id`) REFERENCES `teams`(`team_id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`site_id`) REFERENCES `sites`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`google_account_id`) REFERENCES `google_accounts`(`google_account_id`) ON UPDATE no action ON DELETE no action
);--> statement-breakpoint
INSERT INTO `team_sites` SELECT * FROM `_stage_team_sites` WHERE `site_id` IN (SELECT `id` FROM `sites`);--> statement-breakpoint
DROP TABLE `_stage_team_sites`;--> statement-breakpoint
CREATE INDEX `google_account_id_idx` ON `team_sites` (`google_account_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `team_sites_team_id_site_id_unique` ON `team_sites` (`team_id`,`site_id`);--> statement-breakpoint

CREATE TABLE `indexing_jobs` (
	`indexing_job_id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`site_id` text NOT NULL,
	`path` text NOT NULL,
	`transport` text NOT NULL,
	`state` text DEFAULT 'queued' NOT NULL,
	`attempts` integer DEFAULT 0 NOT NULL,
	`last_error` text,
	`submitted_at` integer,
	`created_at` integer,
	`updated_at` integer,
	FOREIGN KEY (`site_id`) REFERENCES `sites`(`id`) ON UPDATE no action ON DELETE cascade
);--> statement-breakpoint
INSERT INTO `indexing_jobs` SELECT * FROM `_stage_indexing_jobs` WHERE `site_id` IN (SELECT `id` FROM `sites`);--> statement-breakpoint
DROP TABLE `_stage_indexing_jobs`;--> statement-breakpoint
CREATE INDEX `indexing_jobs_site_state_idx` ON `indexing_jobs` (`site_id`,`state`);--> statement-breakpoint
CREATE UNIQUE INDEX `indexing_jobs_site_path_transport_unique` ON `indexing_jobs` (`site_id`,`path`,`transport`);--> statement-breakpoint

CREATE TABLE `indexing_investigations` (
	`indexing_investigation_id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`site_id` text NOT NULL,
	`url` text NOT NULL,
	`issue_type` text NOT NULL,
	`status` text DEFAULT 'investigated' NOT NULL,
	`note` text,
	`investigated_at` integer,
	FOREIGN KEY (`site_id`) REFERENCES `sites`(`id`) ON UPDATE no action ON DELETE cascade
);--> statement-breakpoint
INSERT INTO `indexing_investigations` SELECT * FROM `_stage_indexing_investigations` WHERE `site_id` IN (SELECT `id` FROM `sites`);--> statement-breakpoint
DROP TABLE `_stage_indexing_investigations`;--> statement-breakpoint
CREATE INDEX `indexing_investigations_site_idx` ON `indexing_investigations` (`site_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `indexing_investigations_site_url_issue_unique` ON `indexing_investigations` (`site_id`,`url`,`issue_type`);--> statement-breakpoint

-- The queue tables carry a loose site reference with no foreign key. Rebuilt
-- so the column type matches the schema; unmapped rows keep a null site.
CREATE TABLE `__new_job_batches` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text,
	`parent_batch_id` text,
	`total_jobs` integer DEFAULT 0 NOT NULL,
	`pending_jobs` integer DEFAULT 0 NOT NULL,
	`failed_jobs` integer DEFAULT 0 NOT NULL,
	`on_finish` text,
	`allow_failures` integer DEFAULT 0,
	`site_id` text,
	`user_id` integer,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	`finished_at` integer
);--> statement-breakpoint
INSERT INTO `__new_job_batches` SELECT `id`, `name`, `parent_batch_id`, `total_jobs`, `pending_jobs`, `failed_jobs`, `on_finish`, `allow_failures`, (SELECT `m`.`new_id` FROM `_site_id_map` AS `m` WHERE `m`.`old_id` = `job_batches`.`site_id`), `user_id`, `created_at`, `updated_at`, `finished_at` FROM `job_batches`;--> statement-breakpoint
DROP TABLE `job_batches`;--> statement-breakpoint
ALTER TABLE `__new_job_batches` RENAME TO `job_batches`;--> statement-breakpoint

CREATE TABLE `__new_jobs` (
	`id` text PRIMARY KEY NOT NULL,
	`queue` text NOT NULL,
	`job_type` text NOT NULL,
	`batch_id` text,
	`user_id` integer,
	`site_id` text,
	`payload` text NOT NULL,
	`attempts` integer DEFAULT 0 NOT NULL,
	`max_attempts` integer DEFAULT 3 NOT NULL,
	`reserved_at` integer,
	`available_at` integer NOT NULL,
	`created_at` integer NOT NULL,
	`completed_at` integer,
	`failed_at` integer,
	`last_error` text,
	`duration_ms` integer
);--> statement-breakpoint
INSERT INTO `__new_jobs` SELECT `id`, `queue`, `job_type`, `batch_id`, `user_id`, (SELECT `m`.`new_id` FROM `_site_id_map` AS `m` WHERE `m`.`old_id` = `jobs`.`site_id`), `payload`, `attempts`, `max_attempts`, `reserved_at`, `available_at`, `created_at`, `completed_at`, `failed_at`, `last_error`, `duration_ms` FROM `jobs`;--> statement-breakpoint
DROP TABLE `jobs`;--> statement-breakpoint
ALTER TABLE `__new_jobs` RENAME TO `jobs`;--> statement-breakpoint
CREATE INDEX `queue_idx` ON `jobs` (`queue`);--> statement-breakpoint
CREATE INDEX `batch_idx` ON `jobs` (`batch_id`);--> statement-breakpoint

CREATE TABLE `__new_failed_jobs` (
	`id` text PRIMARY KEY NOT NULL,
	`queue` text NOT NULL,
	`job_type` text NOT NULL,
	`batch_id` text,
	`user_id` integer,
	`site_id` text,
	`payload` text NOT NULL,
	`exception` text NOT NULL,
	`attempts` integer NOT NULL,
	`max_attempts` integer NOT NULL,
	`failed_at` integer NOT NULL
);--> statement-breakpoint
INSERT INTO `__new_failed_jobs` SELECT `id`, `queue`, `job_type`, `batch_id`, `user_id`, (SELECT `m`.`new_id` FROM `_site_id_map` AS `m` WHERE `m`.`old_id` = `failed_jobs`.`site_id`), `payload`, `exception`, `attempts`, `max_attempts`, `failed_at` FROM `failed_jobs`;--> statement-breakpoint
DROP TABLE `failed_jobs`;--> statement-breakpoint
ALTER TABLE `__new_failed_jobs` RENAME TO `failed_jobs`;--> statement-breakpoint

DROP TABLE `_site_parent_map`;--> statement-breakpoint
DROP TABLE `_site_id_map`;--> statement-breakpoint

ALTER TABLE `teams` DROP COLUMN `onboarded_step`;
