-- Drop old job tables (order matters for FK constraints)
DROP TABLE IF EXISTS `failed_jobs`;--> statement-breakpoint
DROP TABLE IF EXISTS `jobs`;--> statement-breakpoint
DROP TABLE IF EXISTS `job_batches`;--> statement-breakpoint

-- Create new job_batches table
CREATE TABLE `job_batches` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text,
	`parent_batch_id` text,
	`total_jobs` integer DEFAULT 0 NOT NULL,
	`pending_jobs` integer DEFAULT 0 NOT NULL,
	`failed_jobs` integer DEFAULT 0 NOT NULL,
	`on_finish` text,
	`allow_failures` integer DEFAULT 0,
	`site_id` integer,
	`user_id` integer,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	`finished_at` integer
);--> statement-breakpoint

-- Create new jobs table
CREATE TABLE `jobs` (
	`id` text PRIMARY KEY NOT NULL,
	`queue` text NOT NULL,
	`job_type` text NOT NULL,
	`batch_id` text,
	`user_id` integer,
	`site_id` integer,
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

-- Create new failed_jobs table
CREATE TABLE `failed_jobs` (
	`id` text PRIMARY KEY NOT NULL,
	`queue` text NOT NULL,
	`job_type` text NOT NULL,
	`batch_id` text,
	`user_id` integer,
	`site_id` integer,
	`payload` text NOT NULL,
	`exception` text NOT NULL,
	`attempts` integer NOT NULL,
	`max_attempts` integer NOT NULL,
	`failed_at` integer NOT NULL
);--> statement-breakpoint

-- Add indexes for jobs table
CREATE INDEX `queue_idx` ON `jobs` (`queue`);--> statement-breakpoint
CREATE INDEX `batch_idx` ON `jobs` (`batch_id`);
