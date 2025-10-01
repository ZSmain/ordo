PRAGMA foreign_keys=OFF;

ALTER TABLE `activity` RENAME TO `activity_old`;

CREATE TABLE `activity` (
    `id` integer PRIMARY KEY NOT NULL,
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

INSERT INTO `activity` (`id`, `name`, `icon`, `daily_goal`, `weekly_goal`, `monthly_goal`, `archived`, `user_id`, `created_at`, `updated_at`)
SELECT `id`, `name`, `icon`, `daily_goal`, `weekly_goal`, `monthly_goal`, `archived`, `user_id`, `created_at`, `updated_at`
FROM `activity_old`;

CREATE TABLE `activity_category` (
    `id` integer PRIMARY KEY NOT NULL,
    `activity_id` integer NOT NULL,
    `category_id` integer NOT NULL,
    `created_at` integer NOT NULL,
    `updated_at` integer NOT NULL,
    FOREIGN KEY (`activity_id`) REFERENCES `activity`(`id`) ON UPDATE no action ON DELETE cascade,
    FOREIGN KEY (`category_id`) REFERENCES `category`(`id`) ON UPDATE no action ON DELETE cascade
);

CREATE UNIQUE INDEX `activity_category_activity_id_category_id_unique` ON `activity_category` (`activity_id`, `category_id`);

INSERT INTO `activity_category` (`activity_id`, `category_id`, `created_at`, `updated_at`)
SELECT `id`, `category_id`, `created_at`, `updated_at`
FROM `activity_old`
WHERE `category_id` IS NOT NULL;

DROP TABLE `activity_old`;

PRAGMA foreign_keys=ON;
