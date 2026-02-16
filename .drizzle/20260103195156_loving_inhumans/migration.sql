CREATE TABLE `reminders` (
	`id` integer PRIMARY KEY AUTOINCREMENT,
	`user` text NOT NULL,
	`content` text NOT NULL,
	`time` integer NOT NULL,
	`createdAt` integer NOT NULL
);
