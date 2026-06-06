-- V9: Add social media campaign posts tracking table
CREATE TABLE campaign_posts (
    id BIGINT NOT NULL AUTO_INCREMENT,
    tenant_id BIGINT NOT NULL,
    campaign VARCHAR(255) NOT NULL,
    title VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    hashtags VARCHAR(500),
    image_prompt TEXT,
    platforms VARCHAR(255) NOT NULL,
    schedule_datetime TIMESTAMP NOT NULL,
    generated_image_url VARCHAR(1000) NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'SCHEDULED',
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    KEY idx_campaign_posts_tenant_id (tenant_id),
    KEY idx_campaign_posts_status (status),
    KEY idx_campaign_posts_schedule_datetime (schedule_datetime),
    CONSTRAINT fk_campaign_posts_tenant FOREIGN KEY (tenant_id) REFERENCES tenants(id)
        ON UPDATE CASCADE ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
