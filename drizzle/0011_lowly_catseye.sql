ALTER TABLE `account` ADD `issuer` text;--> statement-breakpoint
-- better-auth 1.7 identifies accounts by (issuer, accountId). Backfill
-- existing rows before enabling the unique index (see 1.7 upgrade guide).
UPDATE `account` SET `issuer` = 'local:credential' WHERE `provider_id` = 'credential';--> statement-breakpoint
UPDATE `account` SET `issuer` = 'https://accounts.google.com' WHERE `provider_id` = 'google';--> statement-breakpoint
CREATE UNIQUE INDEX `account_issuer_account_id_unique` ON `account` (`issuer`,`account_id`);
