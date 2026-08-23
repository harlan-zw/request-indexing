CREATE TABLE `dataforseo_requests` (
	`dataforseo_request_id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`tool` text NOT NULL,
	`endpoint` text NOT NULL,
	`task_count` integer DEFAULT 1 NOT NULL,
	`status` text NOT NULL,
	`http_status` integer,
	`cost_usd_micros` integer,
	`ip_hash` text,
	`created_at` integer
);
--> statement-breakpoint
CREATE INDEX `dataforseo_requests_created_idx` ON `dataforseo_requests` (`created_at`);--> statement-breakpoint
CREATE INDEX `dataforseo_requests_tool_created_idx` ON `dataforseo_requests` (`tool`,`created_at`);