CREATE TABLE `indexing_investigations` (
	`indexing_investigation_id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`site_id` integer NOT NULL,
	`url` text NOT NULL,
	`issue_type` text NOT NULL,
	`status` text DEFAULT 'investigated' NOT NULL,
	`note` text,
	`investigated_at` integer,
	FOREIGN KEY (`site_id`) REFERENCES `sites`(`site_id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `indexing_investigations_site_idx` ON `indexing_investigations` (`site_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `indexing_investigations_site_url_issue_unique` ON `indexing_investigations` (`site_id`,`url`,`issue_type`);
