DROP TABLE `billing_events`;--> statement-breakpoint
DROP TABLE `stripe_webhook_events`;--> statement-breakpoint
ALTER TABLE `users` DROP COLUMN `stripe_customer_id`;--> statement-breakpoint
ALTER TABLE `users` DROP COLUMN `stripe_email`;--> statement-breakpoint
ALTER TABLE `users` DROP COLUMN `stripe_payment_intent_id`;--> statement-breakpoint
ALTER TABLE `users` DROP COLUMN `stripe_checkout_session_id`;--> statement-breakpoint
ALTER TABLE `users` DROP COLUMN `subscription_id`;--> statement-breakpoint
ALTER TABLE `users` DROP COLUMN `subscription_status`;--> statement-breakpoint
ALTER TABLE `users` DROP COLUMN `subscription_tier`;--> statement-breakpoint
ALTER TABLE `users` DROP COLUMN `billing_cycle`;--> statement-breakpoint
ALTER TABLE `users` DROP COLUMN `sites_limit`;--> statement-breakpoint
ALTER TABLE `users` DROP COLUMN `prompts_limit`;--> statement-breakpoint
ALTER TABLE `users` DROP COLUMN `trial_ends_at`;--> statement-breakpoint
ALTER TABLE `users` DROP COLUMN `current_period_start`;--> statement-breakpoint
ALTER TABLE `users` DROP COLUMN `current_period_end`;--> statement-breakpoint
ALTER TABLE `users` DROP COLUMN `cancel_at_period_end`;--> statement-breakpoint
ALTER TABLE `users` DROP COLUMN `read_only_until`;--> statement-breakpoint
ALTER TABLE `users` DROP COLUMN `archived_at`;