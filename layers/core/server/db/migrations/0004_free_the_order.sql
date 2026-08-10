CREATE TABLE `admin_events` (
	`admin_event_id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`actor_user_id` integer,
	`kind` text NOT NULL,
	`target_type` text,
	`target_id` text,
	`metadata` text,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`actor_user_id`) REFERENCES `users`(`user_id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE INDEX `admin_events_kind_created_idx` ON `admin_events` (`kind`,`created_at`);--> statement-breakpoint
CREATE TABLE `pro_api_usage_events` (
	`api_usage_event_id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`team_id` integer NOT NULL,
	`team_api_token_id` integer,
	`user_id` integer,
	`source` text NOT NULL,
	`method` text,
	`path` text,
	`action` text,
	`target` text,
	`status` text DEFAULT 'success' NOT NULL,
	`status_code` integer,
	`response_time` integer,
	`client` text,
	`ip_hash` text,
	`user_agent` text,
	`error_code` text,
	`created_at` integer,
	FOREIGN KEY (`team_id`) REFERENCES `teams`(`team_id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`team_api_token_id`) REFERENCES `team_api_tokens`(`team_api_token_id`) ON UPDATE no action ON DELETE set null,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`user_id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE INDEX `pro_api_usage_events_team_created_idx` ON `pro_api_usage_events` (`team_id`,`created_at`);--> statement-breakpoint
CREATE INDEX `pro_api_usage_events_token_created_idx` ON `pro_api_usage_events` (`team_api_token_id`,`created_at`);--> statement-breakpoint
CREATE INDEX `pro_api_usage_events_team_source_created_idx` ON `pro_api_usage_events` (`team_id`,`source`,`created_at`);--> statement-breakpoint
CREATE TABLE `billing_events` (
	`billing_event_id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`user_id` integer NOT NULL,
	`team_id` integer,
	`kind` text NOT NULL,
	`stripe_id` text NOT NULL,
	`amount` integer NOT NULL,
	`reason` text,
	`metadata` text,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`user_id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`team_id`) REFERENCES `teams`(`team_id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE INDEX `billing_events_user_kind_idx` ON `billing_events` (`user_id`,`kind`);--> statement-breakpoint
CREATE INDEX `billing_events_team_created_idx` ON `billing_events` (`team_id`,`created_at`);--> statement-breakpoint
CREATE UNIQUE INDEX `billing_events_kind_stripe_id_unique` ON `billing_events` (`kind`,`stripe_id`);--> statement-breakpoint
CREATE TABLE `citation_runs` (
	`citation_run_id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`site_id` integer NOT NULL,
	`prompt_id` text NOT NULL,
	`model` text NOT NULL,
	`ts` integer NOT NULL,
	`cited` integer NOT NULL,
	`position` integer,
	`snippet` text,
	`sources` text,
	`created_at` integer,
	FOREIGN KEY (`site_id`) REFERENCES `sites`(`site_id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `citation_runs_site_prompt_ts_idx` ON `citation_runs` (`site_id`,`prompt_id`,`ts`);--> statement-breakpoint
CREATE UNIQUE INDEX `citation_runs_site_prompt_model_day_unique` ON `citation_runs` (`site_id`,`prompt_id`,`model`,`ts`);--> statement-breakpoint
CREATE TABLE `crawler_hits` (
	`crawler_hit_id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`site_id` integer NOT NULL,
	`ts` integer NOT NULL,
	`engine` text NOT NULL,
	`ua` text NOT NULL,
	`ua_hash` text NOT NULL,
	`path` text NOT NULL,
	`status` integer,
	`country` text,
	FOREIGN KEY (`site_id`) REFERENCES `sites`(`site_id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `crawler_hits_site_ts_idx` ON `crawler_hits` (`site_id`,`ts`);--> statement-breakpoint
CREATE INDEX `crawler_hits_site_engine_ts_idx` ON `crawler_hits` (`site_id`,`engine`,`ts`);--> statement-breakpoint
CREATE TABLE `feedback` (
	`feedback_id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`path` text NOT NULL,
	`thumb` text,
	`comment` text,
	`metadata` text,
	`user_id` integer,
	`created_at` integer,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`user_id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE TABLE `indexing_jobs` (
	`indexing_job_id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`site_id` integer NOT NULL,
	`path` text NOT NULL,
	`transport` text NOT NULL,
	`state` text DEFAULT 'queued' NOT NULL,
	`attempts` integer DEFAULT 0 NOT NULL,
	`last_error` text,
	`submitted_at` integer,
	`created_at` integer,
	`updated_at` integer,
	FOREIGN KEY (`site_id`) REFERENCES `sites`(`site_id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `indexing_jobs_site_state_idx` ON `indexing_jobs` (`site_id`,`state`);--> statement-breakpoint
CREATE UNIQUE INDEX `indexing_jobs_site_path_transport_unique` ON `indexing_jobs` (`site_id`,`path`,`transport`);--> statement-breakpoint
CREATE TABLE `llmstxt_versions` (
	`llmstxt_version_id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`site_id` integer NOT NULL,
	`ts` integer NOT NULL,
	`content_hash` text NOT NULL,
	`content` text NOT NULL,
	`generated_from` text NOT NULL,
	`created_at` integer,
	FOREIGN KEY (`site_id`) REFERENCES `sites`(`site_id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `llmstxt_versions_site_ts_idx` ON `llmstxt_versions` (`site_id`,`ts`);--> statement-breakpoint
CREATE UNIQUE INDEX `llmstxt_versions_site_hash_unique` ON `llmstxt_versions` (`site_id`,`content_hash`);--> statement-breakpoint
CREATE TABLE `pro_mcp_usage` (
	`mcp_usage_id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`user_id` integer,
	`team_id` integer,
	`team_api_token_id` integer,
	`session_id` text NOT NULL,
	`endpoint` text NOT NULL,
	`action` text NOT NULL,
	`target` text,
	`client` text,
	`status` text DEFAULT 'success' NOT NULL,
	`response_time` integer,
	`created_at` integer,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`user_id`) ON UPDATE no action ON DELETE set null,
	FOREIGN KEY (`team_id`) REFERENCES `teams`(`team_id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`team_api_token_id`) REFERENCES `team_api_tokens`(`team_api_token_id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE INDEX `pro_mcp_usage_team_api_token_idx` ON `pro_mcp_usage` (`team_api_token_id`);--> statement-breakpoint
CREATE TABLE `notifications` (
	`notification_id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`public_id` text NOT NULL,
	`user_id` integer NOT NULL,
	`kind` text NOT NULL,
	`title` text,
	`body` text,
	`payload` text,
	`read_at` integer,
	`created_at` integer,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`user_id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `notifications_user_created_idx` ON `notifications` (`user_id`,`created_at`);--> statement-breakpoint
CREATE TABLE `pro_events` (
	`pro_event_id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`user_id` integer NOT NULL,
	`type` text NOT NULL,
	`payload` text,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`user_id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `pro_events_user_type_idx` ON `pro_events` (`user_id`,`type`);--> statement-breakpoint
CREATE TABLE `runtime_errors` (
	`runtime_error_id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`created_at` integer NOT NULL,
	`level` text NOT NULL,
	`name` text NOT NULL,
	`description` text,
	`error` text,
	`ctx` text,
	`request_id` text,
	`user_id` integer,
	`path` text
);
--> statement-breakpoint
CREATE INDEX `runtime_errors_name_created_idx` ON `runtime_errors` (`name`,`created_at`);--> statement-breakpoint
CREATE INDEX `runtime_errors_user_created_idx` ON `runtime_errors` (`user_id`,`created_at`);--> statement-breakpoint
CREATE INDEX `runtime_errors_level_created_idx` ON `runtime_errors` (`level`,`created_at`);--> statement-breakpoint
CREATE TABLE `site_groups` (
	`site_group_id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`public_id` text NOT NULL,
	`team_id` integer,
	`name` text NOT NULL,
	`order` integer DEFAULT 0,
	`created_at` integer,
	FOREIGN KEY (`team_id`) REFERENCES `teams`(`team_id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `stripe_webhook_events` (
	`event_id` text PRIMARY KEY NOT NULL,
	`event_type` text NOT NULL,
	`processed_at` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `team_api_tokens` (
	`team_api_token_id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`public_id` text NOT NULL,
	`team_id` integer NOT NULL,
	`user_id` integer NOT NULL,
	`token_hash` text NOT NULL,
	`last4` text NOT NULL,
	`label` text,
	`role` text NOT NULL,
	`usage_count` integer DEFAULT 0 NOT NULL,
	`last_used_at` integer,
	`expires_at` integer,
	`created_at` integer,
	FOREIGN KEY (`team_id`) REFERENCES `teams`(`team_id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`user_id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `team_api_tokens_team_idx` ON `team_api_tokens` (`team_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `team_api_tokens_token_hash_unique` ON `team_api_tokens` (`token_hash`);--> statement-breakpoint
CREATE TABLE `team_audit_events` (
	`team_audit_event_id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`team_id` integer NOT NULL,
	`actor_user_id` integer,
	`kind` text NOT NULL,
	`target_type` text,
	`target_id` text,
	`metadata` text,
	`created_at` integer,
	FOREIGN KEY (`team_id`) REFERENCES `teams`(`team_id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`actor_user_id`) REFERENCES `users`(`user_id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE INDEX `team_audit_events_team_created_idx` ON `team_audit_events` (`team_id`,`created_at`);--> statement-breakpoint
CREATE TABLE `team_gsc_credentials` (
	`team_gsc_credential_id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`public_id` text NOT NULL,
	`team_id` integer NOT NULL,
	`user_id` integer NOT NULL,
	`gscdump_user_id` text NOT NULL,
	`gscdump_api_key` text NOT NULL,
	`label` text,
	`status` text DEFAULT 'active' NOT NULL,
	`last_used_at` integer,
	`created_at` integer,
	FOREIGN KEY (`team_id`) REFERENCES `teams`(`team_id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`user_id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `team_gsc_credentials_team_user_unique` ON `team_gsc_credentials` (`team_id`,`user_id`);--> statement-breakpoint
CREATE TABLE `team_invitations` (
	`team_invitation_id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`public_id` text NOT NULL,
	`team_id` integer NOT NULL,
	`email` text NOT NULL,
	`role` text NOT NULL,
	`invited_by_id` integer NOT NULL,
	`token` text NOT NULL,
	`expires_at` integer NOT NULL,
	`accepted_at` integer,
	`created_at` integer,
	FOREIGN KEY (`team_id`) REFERENCES `teams`(`team_id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`invited_by_id`) REFERENCES `users`(`user_id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `team_invitations_token_unique` ON `team_invitations` (`token`);--> statement-breakpoint
CREATE UNIQUE INDEX `team_invitations_team_email_unique` ON `team_invitations` (`team_id`,`email`);--> statement-breakpoint
CREATE TABLE `team_memberships` (
	`team_membership_id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`team_id` integer NOT NULL,
	`user_id` integer NOT NULL,
	`role` text NOT NULL,
	`first_visit_dismissed_at` integer,
	`created_at` integer,
	`updated_at` integer,
	FOREIGN KEY (`team_id`) REFERENCES `teams`(`team_id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`user_id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `team_memberships_team_user_unique` ON `team_memberships` (`team_id`,`user_id`);--> statement-breakpoint
CREATE TABLE `telemetry_events` (
	`telemetry_event_id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`source` text NOT NULL,
	`project_hash` text,
	`site_url` text,
	`user_id` integer,
	`modules` text NOT NULL,
	`module_versions` text,
	`config` text,
	`nuxt_version` text,
	`node_version` text,
	`package_manager` text,
	`os` text,
	`ci` text,
	`created_at` integer,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`user_id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE TABLE `user_identities` (
	`user_id` integer NOT NULL,
	`provider` text NOT NULL,
	`provider_user_id` text NOT NULL,
	`email` text,
	`email_verified` integer DEFAULT false NOT NULL,
	`display_name` text,
	`avatar_url` text,
	`linked_at` integer,
	`last_used_at` integer,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`user_id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `user_identities_email_idx` ON `user_identities` (`email`);--> statement-breakpoint
CREATE INDEX `user_identities_user_idx` ON `user_identities` (`user_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `user_identities_pk` ON `user_identities` (`provider`,`provider_user_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `user_identities_user_provider_unique` ON `user_identities` (`user_id`,`provider`);--> statement-breakpoint
ALTER TABLE `teams` ADD `owner_id` integer REFERENCES users(user_id);--> statement-breakpoint
ALTER TABLE `teams` ADD `gscdump_team_id` text;--> statement-breakpoint
ALTER TABLE `users` ADD `api_key` text;--> statement-breakpoint
ALTER TABLE `users` ADD `stripe_customer_id` text;--> statement-breakpoint
ALTER TABLE `users` ADD `stripe_email` text;--> statement-breakpoint
ALTER TABLE `users` ADD `stripe_payment_intent_id` text;--> statement-breakpoint
ALTER TABLE `users` ADD `stripe_checkout_session_id` text;--> statement-breakpoint
ALTER TABLE `users` ADD `subscription_id` text;--> statement-breakpoint
ALTER TABLE `users` ADD `subscription_status` text;--> statement-breakpoint
ALTER TABLE `users` ADD `subscription_tier` text;--> statement-breakpoint
ALTER TABLE `users` ADD `billing_cycle` text;--> statement-breakpoint
ALTER TABLE `users` ADD `sites_limit` integer;--> statement-breakpoint
ALTER TABLE `users` ADD `prompts_limit` integer;--> statement-breakpoint
ALTER TABLE `users` ADD `trial_ends_at` integer;--> statement-breakpoint
ALTER TABLE `users` ADD `current_period_start` integer;--> statement-breakpoint
ALTER TABLE `users` ADD `current_period_end` integer;--> statement-breakpoint
ALTER TABLE `users` ADD `cancel_at_period_end` integer DEFAULT false;--> statement-breakpoint
ALTER TABLE `users` ADD `read_only_until` integer;--> statement-breakpoint
ALTER TABLE `users` ADD `archived_at` integer;--> statement-breakpoint
ALTER TABLE `users` ADD `source` text;--> statement-breakpoint
ALTER TABLE `users` ADD `onboarding_completed_at` integer;--> statement-breakpoint
CREATE UNIQUE INDEX `users_api_key_unique` ON `users` (`api_key`);