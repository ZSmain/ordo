PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_activity` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL,
	`icon` text NOT NULL,
	`daily_goal` integer,
	`weekly_goal` integer,
	`monthly_goal` integer,
	`archived` integer DEFAULT false NOT NULL,
	`user_id` text NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
INSERT INTO `__new_activity`("id", "name", "icon", "daily_goal", "weekly_goal", "monthly_goal", "archived", "user_id", "created_at", "updated_at") SELECT "id", "name", "icon", "daily_goal", "weekly_goal", "monthly_goal", "archived", "user_id", "created_at", "updated_at" FROM `activity`;--> statement-breakpoint
DROP TABLE `activity`;--> statement-breakpoint
ALTER TABLE `__new_activity` RENAME TO `activity`;--> statement-breakpoint
PRAGMA foreign_keys=ON;--> statement-breakpoint
CREATE TABLE `__new_activity_category` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`activity_id` integer NOT NULL,
	`category_id` integer NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`activity_id`) REFERENCES `activity`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`category_id`) REFERENCES `category`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
INSERT INTO `__new_activity_category`("id", "activity_id", "category_id", "created_at", "updated_at") SELECT "id", "activity_id", "category_id", "created_at", "updated_at" FROM `activity_category`;--> statement-breakpoint
DROP TABLE `activity_category`;--> statement-breakpoint
ALTER TABLE `__new_activity_category` RENAME TO `activity_category`;--> statement-breakpoint
CREATE UNIQUE INDEX `activity_category_activity_id_category_id_unique` ON `activity_category` (`activity_id`,`category_id`);--> statement-breakpoint
CREATE TABLE `__new_category` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL,
	`color` text NOT NULL,
	`icon` text NOT NULL,
	`user_id` text NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
INSERT INTO `__new_category`("id", "name", "color", "icon", "user_id", "created_at", "updated_at") SELECT "id", "name", "color", "icon", "user_id", "created_at", "updated_at" FROM `category`;--> statement-breakpoint
DROP TABLE `category`;--> statement-breakpoint
ALTER TABLE `__new_category` RENAME TO `category`;--> statement-breakpoint
CREATE TABLE `__new_time_session` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`activity_id` integer NOT NULL,
	`user_id` text NOT NULL,
	`started_at` integer NOT NULL,
	`stopped_at` integer,
	`duration` integer,
	`is_active` integer DEFAULT true NOT NULL,
	`notes` text,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`activity_id`) REFERENCES `activity`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
INSERT INTO `__new_time_session`("id", "activity_id", "user_id", "started_at", "stopped_at", "duration", "is_active", "notes", "created_at", "updated_at") SELECT "id", "activity_id", "user_id", "started_at", "stopped_at", "duration", "is_active", "notes", "created_at", "updated_at" FROM `time_session`;--> statement-breakpoint
DROP TABLE `time_session`;--> statement-breakpoint
ALTER TABLE `__new_time_session` RENAME TO `time_session`;