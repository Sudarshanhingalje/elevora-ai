-- V13: Email Marketing Campaigns table
CREATE TABLE email_campaigns (
    id BIGINT NOT NULL AUTO_INCREMENT,
    tenant_id BIGINT NOT NULL,
    campaign_name VARCHAR(255) NOT NULL,
    subject_line VARCHAR(500) NOT NULL,
    preview_text VARCHAR(200),
    headline VARCHAR(500),
    body_html TEXT,
    cta_text VARCHAR(255),
    cta_url VARCHAR(500),
    target_audience VARCHAR(500),
    products_promoted TEXT,
    status VARCHAR(50) NOT NULL DEFAULT 'DRAFT',
    sent_count INT NOT NULL DEFAULT 0,
    open_rate DECIMAL(5,2) DEFAULT 0.00,
    click_rate DECIMAL(5,2) DEFAULT 0.00,
    scheduled_at TIMESTAMP NULL,
    sent_at TIMESTAMP NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    KEY idx_email_campaigns_tenant_id (tenant_id),
    KEY idx_email_campaigns_status (status),
    KEY idx_email_campaigns_created_at (created_at),
    CONSTRAINT fk_email_campaigns_tenant FOREIGN KEY (tenant_id) REFERENCES tenants(id)
        ON UPDATE CASCADE ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
