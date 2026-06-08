-- V15: Create user_locations table for tracking signup/login locations
CREATE TABLE user_locations (
    id             BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id        BIGINT NOT NULL,
    tenant_id      BIGINT NOT NULL,
    ip_address     VARCHAR(45) NOT NULL,
    country        VARCHAR(100) NOT NULL DEFAULT 'Unknown',
    state          VARCHAR(100) NOT NULL DEFAULT 'Unknown',
    city           VARCHAR(100) NOT NULL DEFAULT 'Unknown',
    latitude       DOUBLE NOT NULL DEFAULT 0.0,
    longitude      DOUBLE NOT NULL DEFAULT 0.0,
    last_login_at  TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    created_at     TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at     TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY uk_user_locations_user (user_id),
    KEY idx_ul_city (city),
    KEY idx_ul_state (state),
    KEY idx_ul_tenant (tenant_id),
    CONSTRAINT fk_ul_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT fk_ul_tenant FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
