-- V14: Email campaign recipients (subscriber list) and send log
CREATE TABLE email_campaign_recipients (
    id             BIGINT NOT NULL AUTO_INCREMENT,
    campaign_id    BIGINT NOT NULL,
    tenant_id      BIGINT NOT NULL,
    email          VARCHAR(320) NOT NULL,
    name           VARCHAR(255),
    status         VARCHAR(30) NOT NULL DEFAULT 'QUEUED',
    -- QUEUED | SENT | FAILED | UNSUBSCRIBED
    sent_at        TIMESTAMP NULL,
    fail_reason    VARCHAR(500),
    queue_position INT NOT NULL DEFAULT 0,
    created_at     TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    UNIQUE KEY uk_campaign_recipient (campaign_id, email),
    KEY idx_ecr_campaign_status (campaign_id, status),
    KEY idx_ecr_tenant (tenant_id),
    CONSTRAINT fk_ecr_campaign FOREIGN KEY (campaign_id) REFERENCES email_campaigns(id)
        ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT fk_ecr_tenant FOREIGN KEY (tenant_id) REFERENCES tenants(id)
        ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Drip run log: one row per scheduler execution per campaign
CREATE TABLE email_campaign_drip_runs (
    id              BIGINT NOT NULL AUTO_INCREMENT,
    campaign_id     BIGINT NOT NULL,
    tenant_id       BIGINT NOT NULL,
    started_at      TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    finished_at     TIMESTAMP NULL,
    emails_sent     INT NOT NULL DEFAULT 0,
    emails_failed   INT NOT NULL DEFAULT 0,
    status          VARCHAR(30) NOT NULL DEFAULT 'RUNNING',
    -- RUNNING | COMPLETED | STOPPED | ERROR
    notes           TEXT,
    PRIMARY KEY (id),
    KEY idx_ecdr_campaign (campaign_id),
    CONSTRAINT fk_ecdr_campaign FOREIGN KEY (campaign_id) REFERENCES email_campaigns(id)
        ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
