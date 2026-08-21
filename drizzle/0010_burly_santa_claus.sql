CREATE TABLE `goal_history` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`activity_id` integer NOT NULL,
	`daily_goal` integer,
	`weekly_goal` integer,
	`monthly_goal` integer,
	`start_date` text NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`activity_id`) REFERENCES `activity`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `goal_history_activity_id_start_date_unique` ON `goal_history` (`activity_id`,`start_date`);--> statement-breakpoint
ALTER TABLE `activity` DROP COLUMN `daily_goal`;--> statement-breakpoint
ALTER TABLE `activity` DROP COLUMN `weekly_goal`;--> statement-breakpoint
ALTER TABLE `activity` DROP COLUMN `monthly_goal`;