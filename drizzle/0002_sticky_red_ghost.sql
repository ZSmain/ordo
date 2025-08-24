CREATE TABLE `time_session` (
	`id` integer PRIMARY KEY NOT NULL,
	`activity_id` integer NOT NULL,
	`started_at` integer NOT NULL,
	`stopped_at` integer,
	`duration` integer,
	`notes` text,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`activity_id`) REFERENCES `activity`(`id`) ON UPDATE no action ON DELETE cascade
);
