ALTER TABLE `activity` ADD `user_id` text NOT NULL REFERENCES user(id);--> statement-breakpoint
ALTER TABLE `category` ADD `user_id` text NOT NULL REFERENCES user(id);--> statement-breakpoint
ALTER TABLE `category` ADD `created_at` integer NOT NULL;--> statement-breakpoint
ALTER TABLE `category` ADD `updated_at` integer NOT NULL;--> statement-breakpoint
ALTER TABLE `time_session` ADD `user_id` text NOT NULL REFERENCES user(id);