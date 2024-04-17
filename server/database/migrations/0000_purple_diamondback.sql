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
CREATE TABLE `site_url_analytics` (
	`site_url_analytic_id` integer PRIMARY KEY NOT NULL,
	`site_id` integer NOT NULL,
	`page` text,
	`date` text,
	`clicks` integer DEFAULT 0,
	`impressions` integer DEFAULT 0,
	`ctr` integer DEFAULT 0,
	`position` integer DEFAULT 0,
	`created_at` integer DEFAULT (CURRENT_TIMESTAMP) NOT NULL,
	FOREIGN KEY (`site_id`) REFERENCES `sites`(`site_id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `site_urls` (
	`site_id` integer NOT NULL,
	`path` text NOT NULL,
	`last_inspected` integer,
	`status` text,
	`payload` text,
	`created_at` integer DEFAULT (CURRENT_TIMESTAMP) NOT NULL,
	`updated_at` integer DEFAULT (CURRENT_TIMESTAMP) NOT NULL,
	FOREIGN KEY (`site_id`) REFERENCES `sites`(`site_id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `sites` (
	`site_id` integer PRIMARY KEY NOT NULL,
	`public_id` text NOT NULL,
	`property` text NOT NULL,
	`is_domain_property` integer DEFAULT false NOT NULL,
	`sitemaps` text,
	`domain` text,
	`parent_id` integer,
	`created_at` integer DEFAULT (CURRENT_TIMESTAMP) NOT NULL,
	`updated_at` integer DEFAULT (CURRENT_TIMESTAMP) NOT NULL,
	FOREIGN KEY (`parent_id`) REFERENCES `sites`(`site_id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `team_sites` (
	`team_id` integer NOT NULL,
	`site_id` integer NOT NULL,
	`visible` integer DEFAULT true NOT NULL,
	FOREIGN KEY (`team_id`) REFERENCES `teams`(`team_id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`site_id`) REFERENCES `sites`(`site_id`) ON UPDATE no action ON DELETE no action
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
CREATE TABLE `user_team_sites` (
	`team_id` integer NOT NULL,
	`user_id` integer NOT NULL,
	`site_id` integer NOT NULL,
	`origin` text,
	`permission_level` text,
	`visible` integer DEFAULT true NOT NULL,
	FOREIGN KEY (`team_id`) REFERENCES `teams`(`team_id`) ON UPDATE no action ON DELETE no action,
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
	`auth_payload` text,
	`last_login` integer NOT NULL,
	`sub` text NOT NULL,
	`login_tokens` text NOT NULL,
	`analytics_range` text,
	`analytics_period` text,
	`indexing_tokens` text,
	`indexing_oauth_id` text,
	`last_indexing_oauth_id` text,
	`current_team_id` integer NOT NULL,
	`created_at` integer DEFAULT (CURRENT_TIMESTAMP) NOT NULL,
	`updated_at` integer DEFAULT (CURRENT_TIMESTAMP) NOT NULL,
	FOREIGN KEY (`current_team_id`) REFERENCES `teams`(`team_id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `sessions_user_id_ip_address_user_agent_unique` ON `sessions` (`user_id`,`ip_address`,`user_agent`);--> statement-breakpoint
CREATE INDEX `path_idx_analytics` ON `site_url_analytics` (`page`);--> statement-breakpoint
CREATE INDEX `date_idx_analytics` ON `site_url_analytics` (`date`);--> statement-breakpoint
CREATE INDEX `path_site_url_idx` ON `site_urls` (`path`);--> statement-breakpoint
CREATE UNIQUE INDEX `site_urls_site_id_path_unique` ON `site_urls` (`site_id`,`path`);--> statement-breakpoint
CREATE UNIQUE INDEX `team_sites_team_id_site_id_unique` ON `team_sites` (`team_id`,`site_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `team_user_team_id_user_id_unique` ON `team_user` (`team_id`,`user_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `user_team_sites_team_id_user_id_site_id_unique` ON `user_team_sites` (`team_id`,`user_id`,`site_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `users_email_unique` ON `users` (`email`);--> statement-breakpoint
CREATE UNIQUE INDEX `users_sub_unique` ON `users` (`sub`);