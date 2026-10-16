CREATE TABLE `connections` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`url` text NOT NULL,
	`username` text,
	`encrypted_password` text,
	`database` text,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL
);
