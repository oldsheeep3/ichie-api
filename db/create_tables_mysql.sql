-- MySQL DDL for Surechigai (derived from docs/diagrams/er.mmd)
-- This script is for use with MySQL/MariaDB. It is mounted into
-- /docker-entrypoint-initdb.d/ so it runs on first container startup.

-- Use the automatically-created database (MYSQL_DATABASE) or use `surechigai`.
USE `surechigai`;

CREATE TABLE IF NOT EXISTS `users` (
  `id` CHAR(36) NOT NULL,
  `name` TEXT NOT NULL,
  `mail` TEXT,
  `github` TEXT,
  `x` TEXT,
  `icon` TEXT NOT NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `oauth_accounts` (
  `id` CHAR(36) NOT NULL,
  `user_id` CHAR(36) NOT NULL,
  `provider` VARCHAR(255) NOT NULL,
  `provider_account_id` VARCHAR(255) NOT NULL,
  `provider_token` TEXT,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `ux_provider_account` (`provider`, `provider_account_id`),
  KEY `idx_oauth_user_id` (`user_id`),
  CONSTRAINT `fk_oauth_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `refresh_tokens` (
  `id` CHAR(36) NOT NULL,
  `user_id` CHAR(36) NOT NULL,
  `token` TEXT NOT NULL,
  `expires_at` TIMESTAMP NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_refresh_tokens_user_id` (`user_id`),
  KEY `idx_refresh_tokens_token` (`token`(191)),
  CONSTRAINT `fk_refresh_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `ibeacon_datas` (
  `user_id` CHAR(36) NOT NULL,
  `major` INT NOT NULL,
  `minor` INT NOT NULL,
  PRIMARY KEY (`user_id`),
  KEY `idx_ibeacon_major_minor` (`major`,`minor`),
  CONSTRAINT `fk_ibeacon_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE UNIQUE INDEX IF NOT EXISTS `ux_ibeacon_major_minor` ON `ibeacon_datas` (`major`,`minor`);

CREATE TABLE IF NOT EXISTS `messages` (
  `id` CHAR(36) NOT NULL,
  `user_id` CHAR(36) NOT NULL,
  `message` TEXT NOT NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `deleted_at` TIMESTAMP NULL,
  PRIMARY KEY (`id`),
  KEY `idx_messages_user_id` (`user_id`),
  CONSTRAINT `fk_messages_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Notes:
-- This schema uses CHAR(36) for UUID strings. MySQL's UUID() function can be used
-- by client code when inserting rows (e.g. INSERT INTO users (id, name, ...) VALUES (UUID(), ...)).
