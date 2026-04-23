ALTER TABLE `site_path_date_analytics` ADD `psi_desktop_ttfb` integer;--> statement-breakpoint
ALTER TABLE `site_path_date_analytics` ADD `psi_mobile_ttfb` integer;--> statement-breakpoint
ALTER TABLE `site_path_date_analytics` ADD `mobile_cls_75` integer;--> statement-breakpoint
ALTER TABLE `site_path_date_analytics` ADD `mobile_ttfb_75` integer;--> statement-breakpoint
ALTER TABLE `site_path_date_analytics` ADD `mobile_fcp_75` integer;--> statement-breakpoint
ALTER TABLE `site_path_date_analytics` ADD `mobile_lcp_75` integer;--> statement-breakpoint
ALTER TABLE `site_path_date_analytics` ADD `mobile_inp_75` integer;--> statement-breakpoint
ALTER TABLE `site_path_date_analytics` ADD `desktop_cls_75` integer;--> statement-breakpoint
ALTER TABLE `site_path_date_analytics` ADD `desktop_ttfb_75` integer;--> statement-breakpoint
ALTER TABLE `site_path_date_analytics` ADD `desktop_fcp_75` integer;--> statement-breakpoint
ALTER TABLE `site_path_date_analytics` ADD `desktop_lcp_75` integer;--> statement-breakpoint
ALTER TABLE `site_path_date_analytics` ADD `desktop_inp_75` integer;--> statement-breakpoint
ALTER TABLE `site_path_date_analytics` ADD `loading_experience` text;--> statement-breakpoint
ALTER TABLE `site_paths` ADD `has_crux_origin_data` integer DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE `sites` ADD `has_crux_origin_data` integer DEFAULT false NOT NULL;