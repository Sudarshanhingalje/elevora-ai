-- V8: Add display name to users and create notification preferences table

-- Add name column to users (nullable with default derived from email)
ALTER TABLE users ADD COLUMN full_name VARCHAR(255) NULL AFTER email;

-- Notification preferences per user
CREATE TABLE user_notification_prefs (
    id          BIGINT NOT NULL AUTO_INCREMENT,
    tenant_id   BIGINT NOT NULL,
    user_id     BIGINT NOT NULL,
    email_notifs    BOOLEAN NOT NULL DEFAULT TRUE,
    in_app_notifs   BOOLEAN NOT NULL DEFAULT TRUE,
    billing_alerts  BOOLEAN NOT NULL DEFAULT TRUE,
    support_updates BOOLEAN NOT NULL DEFAULT TRUE,
    updated_at  TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    UNIQUE KEY uk_notif_prefs_user (tenant_id, user_id),
    CONSTRAINT fk_notif_prefs_user FOREIGN KEY (user_id, tenant_id)
        REFERENCES users (id, tenant_id) ON UPDATE CASCADE ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
