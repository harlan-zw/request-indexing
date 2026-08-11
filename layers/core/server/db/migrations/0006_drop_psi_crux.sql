DROP TABLE `site_pagespeed_insight_scan_audits`;--> statement-breakpoint
DROP TABLE `site_pagespeed_insight_scans`;--> statement-breakpoint
ALTER TABLE `site_date_analytics` DROP COLUMN `origin_loading_experience`;--> statement-breakpoint
ALTER TABLE `site_path_date_analytics` DROP COLUMN `psi_desktop_performance`;--> statement-breakpoint
ALTER TABLE `site_path_date_analytics` DROP COLUMN `psi_mobile_performance`;--> statement-breakpoint
ALTER TABLE `site_path_date_analytics` DROP COLUMN `psi_desktop_seo`;--> statement-breakpoint
ALTER TABLE `site_path_date_analytics` DROP COLUMN `psi_mobile_seo`;--> statement-breakpoint
ALTER TABLE `site_path_date_analytics` DROP COLUMN `psi_desktop_accessibility`;--> statement-breakpoint
ALTER TABLE `site_path_date_analytics` DROP COLUMN `psi_mobile_accessibility`;--> statement-breakpoint
ALTER TABLE `site_path_date_analytics` DROP COLUMN `psi_desktop_best_practices`;--> statement-breakpoint
ALTER TABLE `site_path_date_analytics` DROP COLUMN `psi_mobile_best_practices`;--> statement-breakpoint
ALTER TABLE `site_path_date_analytics` DROP COLUMN `psi_desktop_score`;--> statement-breakpoint
ALTER TABLE `site_path_date_analytics` DROP COLUMN `psi_mobile_score`;--> statement-breakpoint
ALTER TABLE `site_path_date_analytics` DROP COLUMN `psi_desktop_lcp`;--> statement-breakpoint
ALTER TABLE `site_path_date_analytics` DROP COLUMN `psi_desktop_fcp`;--> statement-breakpoint
ALTER TABLE `site_path_date_analytics` DROP COLUMN `psi_desktop_si`;--> statement-breakpoint
ALTER TABLE `site_path_date_analytics` DROP COLUMN `psi_desktop_cls`;--> statement-breakpoint
ALTER TABLE `site_path_date_analytics` DROP COLUMN `psi_mobile_tbt`;--> statement-breakpoint
ALTER TABLE `site_path_date_analytics` DROP COLUMN `psi_desktop_ttfb`;--> statement-breakpoint
ALTER TABLE `site_path_date_analytics` DROP COLUMN `psi_mobile_lcp`;--> statement-breakpoint
ALTER TABLE `site_path_date_analytics` DROP COLUMN `psi_mobile_fcp`;--> statement-breakpoint
ALTER TABLE `site_path_date_analytics` DROP COLUMN `psi_mobile_si`;--> statement-breakpoint
ALTER TABLE `site_path_date_analytics` DROP COLUMN `psi_mobile_cls`;--> statement-breakpoint
ALTER TABLE `site_path_date_analytics` DROP COLUMN `psi_desktop_tbt`;--> statement-breakpoint
ALTER TABLE `site_path_date_analytics` DROP COLUMN `psi_mobile_ttfb`;--> statement-breakpoint
ALTER TABLE `site_path_date_analytics` DROP COLUMN `mobile_cls_75`;--> statement-breakpoint
ALTER TABLE `site_path_date_analytics` DROP COLUMN `mobile_ttfb_75`;--> statement-breakpoint
ALTER TABLE `site_path_date_analytics` DROP COLUMN `mobile_fcp_75`;--> statement-breakpoint
ALTER TABLE `site_path_date_analytics` DROP COLUMN `mobile_lcp_75`;--> statement-breakpoint
ALTER TABLE `site_path_date_analytics` DROP COLUMN `mobile_inp_75`;--> statement-breakpoint
ALTER TABLE `site_path_date_analytics` DROP COLUMN `desktop_cls_75`;--> statement-breakpoint
ALTER TABLE `site_path_date_analytics` DROP COLUMN `desktop_ttfb_75`;--> statement-breakpoint
ALTER TABLE `site_path_date_analytics` DROP COLUMN `desktop_fcp_75`;--> statement-breakpoint
ALTER TABLE `site_path_date_analytics` DROP COLUMN `desktop_lcp_75`;--> statement-breakpoint
ALTER TABLE `site_path_date_analytics` DROP COLUMN `desktop_inp_75`;--> statement-breakpoint
ALTER TABLE `site_path_date_analytics` DROP COLUMN `loading_experience`;--> statement-breakpoint
ALTER TABLE `site_paths` DROP COLUMN `has_crux_origin_data`;--> statement-breakpoint
ALTER TABLE `sites` DROP COLUMN `has_crux_origin_data`;