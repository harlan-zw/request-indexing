DROP TABLE `pro_api_usage_events`;--> statement-breakpoint
DROP TABLE `keywords`;--> statement-breakpoint
DROP TABLE `pro_mcp_usage`;--> statement-breakpoint
DROP TABLE `related_keywords`;--> statement-breakpoint
DROP TABLE `site_keyword_date_analytics`;--> statement-breakpoint
DROP TABLE `site_keyword_date_path_analytics`;--> statement-breakpoint
DROP TABLE `team_api_tokens`;--> statement-breakpoint
DROP INDEX `users_api_key_unique`;--> statement-breakpoint
ALTER TABLE `users` DROP COLUMN `api_key`;