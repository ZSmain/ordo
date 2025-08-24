CREATE TABLE `activity` (
	`id` integer PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`daily_goal` integer,
	`weekly_goal` integer,
	`monthly_goal` integer,
	`category_id` integer NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`category_id`) REFERENCES `category`(`id`) ON UPDATE no action ON DELETE cascade
);
