-- Flyway V7 platform architecture expansion schema modification

-- 1. Product Catalog expansion
ALTER TABLE products ADD COLUMN features TEXT;
ALTER TABLE products ADD COLUMN tech_stack TEXT;
ALTER TABLE products ADD COLUMN video_url VARCHAR(500);
ALTER TABLE products ADD COLUMN screenshots TEXT;
ALTER TABLE products ADD COLUMN deployment_template TEXT;
ALTER TABLE products ADD COLUMN repository_info VARCHAR(500);

-- 2. User fields needed by Admin analytics
ALTER TABLE users ADD COLUMN name VARCHAR(160);
ALTER TABLE users ADD COLUMN active BOOLEAN NOT NULL DEFAULT TRUE;

-- 3. Deployment Logs table
CREATE TABLE deployment_logs (
    id BIGINT NOT NULL AUTO_INCREMENT,
    deployment_id BIGINT NOT NULL,
    tenant_id BIGINT NOT NULL,
    log_line TEXT NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    KEY idx_deployment_logs_deployment (deployment_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- 4. Marketing Campaigns table
CREATE TABLE campaigns (
    id BIGINT NOT NULL AUTO_INCREMENT,
    tenant_id BIGINT NOT NULL,
    name VARCHAR(255) NOT NULL,
    platform ENUM('GOOGLE', 'META', 'LINKEDIN') NOT NULL,
    status ENUM('ACTIVE', 'PAUSED', 'COMPLETED', 'ARCHIVED') NOT NULL DEFAULT 'ACTIVE',
    budget DECIMAL(12,2) NOT NULL DEFAULT 0.00,
    spent DECIMAL(12,2) NOT NULL DEFAULT 0.00,
    clicks INT NOT NULL DEFAULT 0,
    impressions INT NOT NULL DEFAULT 0,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    KEY idx_campaigns_tenant_id (tenant_id),
    KEY idx_campaigns_status (status),
    CONSTRAINT fk_campaigns_tenant FOREIGN KEY (tenant_id) REFERENCES tenants(id)
        ON UPDATE CASCADE ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- 5. AI Agent Monitors table
CREATE TABLE agent_monitors (
    id BIGINT NOT NULL AUTO_INCREMENT,
    tenant_id BIGINT NOT NULL,
    agent_name VARCHAR(120) NOT NULL,
    status ENUM('IDLE', 'RUNNING', 'FAILED', 'SUCCESS') NOT NULL DEFAULT 'IDLE',
    success_rate DECIMAL(5,2) NOT NULL DEFAULT 100.00,
    total_runs INT NOT NULL DEFAULT 0,
    errors_count INT NOT NULL DEFAULT 0,
    last_run_at TIMESTAMP NULL,
    PRIMARY KEY (id),
    KEY idx_agent_monitors_tenant_id (tenant_id),
    CONSTRAINT fk_agent_monitors_tenant FOREIGN KEY (tenant_id) REFERENCES tenants(id)
        ON UPDATE CASCADE ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
