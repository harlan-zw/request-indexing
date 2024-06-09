CREATE TABLE `failed_jobs` (
	`failed_job_id` integer PRIMARY KEY NOT NULL,
	`job_id` integer NOT NULL,
	`exception` text NOT NULL,
	`failed_at` integer DEFAULT (CURRENT_TIMESTAMP) NOT NULL,
	FOREIGN KEY (`job_id`) REFERENCES `jobs`(`job_id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `google_accounts` (
	`google_account_id` integer PRIMARY KEY NOT NULL,
	`user_id` integer NOT NULL,
	`type` text NOT NULL,
	`payload` text NOT NULL,
	`token_info` text,
	`tokens` text NOT NULL,
	`google_oauth_client_id` integer NOT NULL,
	`created_at` integer DEFAULT (CURRENT_TIMESTAMP) NOT NULL,
	`updated_at` integer DEFAULT (CURRENT_TIMESTAMP) NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`user_id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`google_oauth_client_id`) REFERENCES `google_oauth_clients`(`google_oauth_client_id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `google_oauth_clients` (
	`google_oauth_client_id` integer PRIMARY KEY NOT NULL,
	`label` text NOT NULL,
	`client_id` text NOT NULL,
	`client_secret` text NOT NULL,
	`reserved` integer DEFAULT false NOT NULL,
	`created_at` integer DEFAULT (CURRENT_TIMESTAMP) NOT NULL,
	`updated_at` integer DEFAULT (CURRENT_TIMESTAMP) NOT NULL
);
--> statement-breakpoint
CREATE TABLE `job_batches` (
	`job_batch_id` integer PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`total_jobs` integer DEFAULT 0 NOT NULL,
	`running_jobs` integer DEFAULT 0 NOT NULL,
	`pending_jobs` integer DEFAULT 0 NOT NULL,
	`failed_jobs` integer DEFAULT 0 NOT NULL,
	`failed_job_ids` text,
	`options` text,
	`cancelled_at` integer,
	`created_at` integer DEFAULT (CURRENT_TIMESTAMP) NOT NULL,
	`finished_at` integer
);
--> statement-breakpoint
CREATE TABLE `jobs` (
	`job_id` integer PRIMARY KEY NOT NULL,
	`queue` text NOT NULL,
	`entity_id` integer,
	`entity_type` text,
	`priority` integer DEFAULT 0 NOT NULL,
	`job_batch_id` integer,
	`name` text NOT NULL,
	`payload` text NOT NULL,
	`response` text,
	`attempts` integer DEFAULT 0 NOT NULL,
	`available_at` integer,
	`created_at` integer DEFAULT (CURRENT_TIMESTAMP) NOT NULL,
	`time_taken` integer,
	`started_at` integer,
	`status` text DEFAULT 'pending' NOT NULL,
	FOREIGN KEY (`job_batch_id`) REFERENCES `job_batches`(`job_batch_id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `keywords` (
	`keyword_id` integer PRIMARY KEY NOT NULL,
	`keyword` text NOT NULL,
	`competition_index` integer,
	`competition` text,
	`monthly_search_volumes` text,
	`avg_monthly_searches` integer,
	`current_month_search_volume` integer,
	`average_cpc_micros` integer,
	`last_synced` integer,
	`created_at` integer DEFAULT (CURRENT_TIMESTAMP) NOT NULL,
	`updated_at` integer DEFAULT (CURRENT_TIMESTAMP) NOT NULL
);
--> statement-breakpoint
CREATE TABLE `related_keywords` (
	`keyword_id` integer NOT NULL,
	`related_keyword_id` integer NOT NULL,
	`site_id` integer NOT NULL,
	FOREIGN KEY (`keyword_id`) REFERENCES `keywords`(`keyword_id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`related_keyword_id`) REFERENCES `keywords`(`keyword_id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`site_id`) REFERENCES `sites`(`site_id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `sessions` (
	`session_id` integer PRIMARY KEY NOT NULL,
	`user_id` integer NOT NULL,
	`ip_address` text,
	`user_agent` text,
	`payload` text,
	`last_activity` integer,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`user_id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `site_date_analytics` (
	`site_id` integer NOT NULL,
	`date` text NOT NULL,
	`clicks` integer DEFAULT 0,
	`impressions` integer DEFAULT 0,
	`ctr` integer DEFAULT 0,
	`position` integer DEFAULT 0,
	`keywords` integer,
	`pages` integer,
	`mobile_clicks` integer,
	`mobile_impressions` integer,
	`mobile_ctr` integer,
	`mobile_position` integer,
	`desktop_clicks` integer,
	`desktop_impressions` integer,
	`desktop_ctr` integer,
	`desktop_position` integer,
	`tablet_clicks` integer,
	`tablet_impressions` integer,
	`tablet_ctr` integer,
	`tablet_position` integer,
	`is_synced` integer DEFAULT false NOT NULL,
	`indexed_pages_count` integer DEFAULT 0,
	`total_pages_count` integer DEFAULT 0,
	`created_at` integer DEFAULT (CURRENT_TIMESTAMP) NOT NULL,
	`updated_at` integer DEFAULT (CURRENT_TIMESTAMP) NOT NULL,
	FOREIGN KEY (`site_id`) REFERENCES `sites`(`site_id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `site_date_country_analytics` (
	`site_id` integer NOT NULL,
	`date` text NOT NULL,
	`country` text NOT NULL,
	`clicks` integer DEFAULT 0,
	`impressions` integer DEFAULT 0,
	`ctr` integer DEFAULT 0,
	`position` integer DEFAULT 0,
	`created_at` integer DEFAULT (CURRENT_TIMESTAMP) NOT NULL,
	`updated_at` integer DEFAULT (CURRENT_TIMESTAMP) NOT NULL,
	FOREIGN KEY (`site_id`) REFERENCES `sites`(`site_id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `site_keyword_date_analytics` (
	`site_id` integer NOT NULL,
	`date` text NOT NULL,
	`keyword` text NOT NULL,
	`clicks` integer DEFAULT 0,
	`impressions` integer DEFAULT 0,
	`ctr` integer DEFAULT 0,
	`position` integer DEFAULT 0,
	`created_at` integer DEFAULT (CURRENT_TIMESTAMP) NOT NULL,
	`updated_at` integer DEFAULT (CURRENT_TIMESTAMP) NOT NULL,
	FOREIGN KEY (`site_id`) REFERENCES `sites`(`site_id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `site_keyword_date_path_analytics` (
	`site_id` integer NOT NULL,
	`date` text NOT NULL,
	`keyword` text NOT NULL,
	`path` text NOT NULL,
	`country` text NOT NULL,
	`device` text NOT NULL,
	`clicks` integer DEFAULT 0,
	`impressions` integer DEFAULT 0,
	`ctr` integer DEFAULT 0,
	`position` integer DEFAULT 0,
	`created_at` integer DEFAULT (CURRENT_TIMESTAMP) NOT NULL,
	`updated_at` integer DEFAULT (CURRENT_TIMESTAMP) NOT NULL,
	FOREIGN KEY (`site_id`) REFERENCES `sites`(`site_id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `site_pagespeed_insight_scans` (
	`site_pagespeed_insight_scan_id` integer PRIMARY KEY NOT NULL,
	`site_id` integer NOT NULL,
	`path` text NOT NULL,
	`strategy` text NOT NULL,
	`performance` integer,
	`seo` integer,
	`accessibility` integer,
	`best_practices` integer,
	`report_path` text,
	`report_screenshot_path` text,
	`created_at` integer DEFAULT (CURRENT_TIMESTAMP) NOT NULL,
	FOREIGN KEY (`site_id`) REFERENCES `sites`(`site_id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `site_path_date_analytics` (
	`site_id` integer NOT NULL,
	`date` text NOT NULL,
	`path` text NOT NULL,
	`clicks` integer DEFAULT 0,
	`impressions` integer DEFAULT 0,
	`ctr` integer DEFAULT 0,
	`position` integer DEFAULT 0,
	`psi_desktop_performance` integer,
	`psi_mobile_performance` integer,
	`psi_desktop_seo` integer,
	`psi_mobile_seo` integer,
	`psi_desktop_accessibility` integer,
	`psi_mobile_accessibility` integer,
	`psi_desktop_best_practices` integer,
	`psi_mobile_best_practices` integer,
	`psi_desktop_score` integer,
	`psi_mobile_score` integer,
	`psi_desktop_lcp` integer,
	`psi_mobile_lcp` integer,
	`psi_desktop_fcp` integer,
	`psi_mobile_fcp` integer,
	`psi_desktop_si` integer,
	`psi_mobile_si` integer,
	`psi_desktop_tbt` integer,
	`psi_mobile_tbt` integer,
	`psi_desktop_cls` integer,
	`psi_mobile_cls` integer,
	`created_at` integer DEFAULT (CURRENT_TIMESTAMP) NOT NULL,
	`updated_at` integer DEFAULT (CURRENT_TIMESTAMP) NOT NULL,
	FOREIGN KEY (`site_id`) REFERENCES `sites`(`site_id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `site_paths` (
	`site_id` integer NOT NULL,
	`path` text NOT NULL,
	`first_seen_indexed` integer,
	`is_indexed` integer DEFAULT false NOT NULL,
	`indexing_verdict` text,
	`inspection_payload` text,
	`last_inspected` integer,
	`created_at` integer DEFAULT (CURRENT_TIMESTAMP) NOT NULL,
	`updated_at` integer DEFAULT (CURRENT_TIMESTAMP) NOT NULL,
	FOREIGN KEY (`site_id`) REFERENCES `sites`(`site_id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `sites` (
	`site_id` integer PRIMARY KEY NOT NULL,
	`public_id` text NOT NULL,
	`property` text NOT NULL,
	`active` integer DEFAULT false NOT NULL,
	`sitemaps` text,
	`domain` text,
	`parent_id` integer,
	`last_synced` integer,
	`is_synced` integer DEFAULT false,
	`owner_id` integer,
	`created_at` integer DEFAULT (CURRENT_TIMESTAMP) NOT NULL,
	`updated_at` integer DEFAULT (CURRENT_TIMESTAMP) NOT NULL,
	FOREIGN KEY (`parent_id`) REFERENCES `sites`(`site_id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`owner_id`) REFERENCES `users`(`user_id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `team_sites` (
	`team_id` integer NOT NULL,
	`site_id` integer NOT NULL,
	`google_account_id` integer NOT NULL,
	FOREIGN KEY (`team_id`) REFERENCES `teams`(`team_id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`site_id`) REFERENCES `sites`(`site_id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`google_account_id`) REFERENCES `google_accounts`(`google_account_id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `team_user` (
	`team_id` integer NOT NULL,
	`user_id` integer NOT NULL,
	`role` text,
	`created_at` integer DEFAULT (CURRENT_TIMESTAMP) NOT NULL,
	`updated_at` integer DEFAULT (CURRENT_TIMESTAMP) NOT NULL,
	FOREIGN KEY (`team_id`) REFERENCES `teams`(`team_id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`user_id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `team_user_invite` (
	`invite_id` text PRIMARY KEY NOT NULL,
	`team_id` integer NOT NULL,
	`email` text NOT NULL,
	`role` text,
	`created_at` integer DEFAULT (CURRENT_TIMESTAMP) NOT NULL,
	`updated_at` integer DEFAULT (CURRENT_TIMESTAMP) NOT NULL
);
--> statement-breakpoint
CREATE TABLE `teams` (
	`team_id` integer PRIMARY KEY NOT NULL,
	`public_id` text NOT NULL,
	`personal_team` integer DEFAULT true NOT NULL,
	`name` text NOT NULL,
	`backups_enabled` integer DEFAULT 0 NOT NULL,
	`onboarded_step` text,
	`created_at` integer DEFAULT (CURRENT_TIMESTAMP) NOT NULL,
	`updated_at` integer DEFAULT (CURRENT_TIMESTAMP) NOT NULL
);
--> statement-breakpoint
CREATE TABLE `usages` (
	`usage_id` integer PRIMARY KEY NOT NULL,
	`team_id` integer NOT NULL,
	`api` text NOT NULL,
	`created_at` integer DEFAULT (CURRENT_TIMESTAMP) NOT NULL,
	`updated_at` integer DEFAULT (CURRENT_TIMESTAMP) NOT NULL,
	FOREIGN KEY (`team_id`) REFERENCES `teams`(`team_id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `user_sites` (
	`user_id` integer NOT NULL,
	`site_id` integer NOT NULL,
	`permission_level` text,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`user_id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`site_id`) REFERENCES `sites`(`site_id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `users` (
	`user_id` integer PRIMARY KEY NOT NULL,
	`public_id` text NOT NULL,
	`name` text NOT NULL,
	`email` text NOT NULL,
	`avatar` text NOT NULL,
	`last_login` integer NOT NULL,
	`sub` text NOT NULL,
	`analytics_range` text,
	`analytics_period` text,
	`last_indexing_oauth_id` text,
	`current_team_id` integer NOT NULL,
	`created_at` integer DEFAULT (CURRENT_TIMESTAMP) NOT NULL,
	`updated_at` integer DEFAULT (CURRENT_TIMESTAMP) NOT NULL,
	FOREIGN KEY (`current_team_id`) REFERENCES `teams`(`team_id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `google_oauth_clients_client_id_unique` ON `google_oauth_clients` (`client_id`);--> statement-breakpoint
CREATE INDEX `queue_idx` ON `jobs` (`queue`);--> statement-breakpoint
CREATE INDEX `status_idx` ON `jobs` (`status`);--> statement-breakpoint
CREATE UNIQUE INDEX `keywords_keyword_unique` ON `keywords` (`keyword`);--> statement-breakpoint
CREATE UNIQUE INDEX `related_keywords_keyword_id_related_keyword_id_site_id_unique` ON `related_keywords` (`keyword_id`,`related_keyword_id`,`site_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `sessions_user_id_ip_address_user_agent_unique` ON `sessions` (`user_id`,`ip_address`,`user_agent`);--> statement-breakpoint
CREATE UNIQUE INDEX `site_date_analytics_site_id_date_unique` ON `site_date_analytics` (`site_id`,`date`);--> statement-breakpoint
CREATE UNIQUE INDEX `site_date_country_analytics_site_id_date_country_unique` ON `site_date_country_analytics` (`site_id`,`date`,`country`);--> statement-breakpoint
CREATE UNIQUE INDEX `site_keyword_date_analytics_site_id_date_keyword_unique` ON `site_keyword_date_analytics` (`site_id`,`date`,`keyword`);--> statement-breakpoint
CREATE UNIQUE INDEX `site_keyword_date_path_analytics_site_id_date_keyword_path_country_device_unique` ON `site_keyword_date_path_analytics` (`site_id`,`date`,`keyword`,`path`,`country`,`device`);--> statement-breakpoint
CREATE INDEX `path_idx` ON `site_pagespeed_insight_scans` (`path`);--> statement-breakpoint
CREATE INDEX `strategy_idx` ON `site_pagespeed_insight_scans` (`strategy`);--> statement-breakpoint
CREATE UNIQUE INDEX `site_path_date_analytics_site_id_date_path_unique` ON `site_path_date_analytics` (`site_id`,`date`,`path`);--> statement-breakpoint
CREATE INDEX `path_site_url_idx` ON `site_paths` (`path`);--> statement-breakpoint
CREATE UNIQUE INDEX `site_paths_site_id_path_unique` ON `site_paths` (`site_id`,`path`);--> statement-breakpoint
CREATE UNIQUE INDEX `sites_domain_unique` ON `sites` (`domain`);--> statement-breakpoint
CREATE UNIQUE INDEX `sites_public_id_unique` ON `sites` (`public_id`);--> statement-breakpoint
CREATE INDEX `google_account_id_idx` ON `team_sites` (`google_account_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `team_sites_team_id_site_id_unique` ON `team_sites` (`team_id`,`site_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `team_user_team_id_user_id_unique` ON `team_user` (`team_id`,`user_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `user_sites_user_id_site_id_unique` ON `user_sites` (`user_id`,`site_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `users_email_unique` ON `users` (`email`);--> statement-breakpoint
CREATE UNIQUE INDEX `users_sub_unique` ON `users` (`sub`);