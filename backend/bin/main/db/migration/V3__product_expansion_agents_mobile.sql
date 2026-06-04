CREATE TABLE gym_members (
    id BIGINT NOT NULL AUTO_INCREMENT,
    tenant_id BIGINT NOT NULL,
    full_name VARCHAR(160) NOT NULL,
    phone VARCHAR(20) NOT NULL,
    email VARCHAR(255),
    membership_plan ENUM('MONTHLY', 'QUARTERLY', 'YEARLY') NOT NULL DEFAULT 'MONTHLY',
    status ENUM('ACTIVE', 'EXPIRED', 'PAUSED') NOT NULL DEFAULT 'ACTIVE',
    next_payment_date DATE NOT NULL,
    last_reminder_at TIMESTAMP NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    UNIQUE KEY uk_gym_members_tenant_phone (tenant_id, phone),
    KEY idx_gym_members_tenant_id (tenant_id),
    KEY idx_gym_members_status (status),
    KEY idx_gym_members_next_payment_date (next_payment_date),
    CONSTRAINT fk_gym_members_tenant FOREIGN KEY (tenant_id) REFERENCES tenants(id)
        ON UPDATE CASCADE ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE gym_reminders (
    id BIGINT NOT NULL AUTO_INCREMENT,
    tenant_id BIGINT NOT NULL,
    member_id BIGINT NOT NULL,
    channel ENUM('WHATSAPP', 'EMAIL') NOT NULL DEFAULT 'WHATSAPP',
    message TEXT NOT NULL,
    n8n_webhook_url VARCHAR(500),
    status ENUM('QUEUED', 'SENT', 'FAILED') NOT NULL DEFAULT 'QUEUED',
    sent_at TIMESTAMP NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    KEY idx_gym_reminders_tenant_id (tenant_id),
    KEY idx_gym_reminders_status (status),
    CONSTRAINT fk_gym_reminders_tenant FOREIGN KEY (tenant_id) REFERENCES tenants(id)
        ON UPDATE CASCADE ON DELETE RESTRICT,
    CONSTRAINT fk_gym_reminders_member FOREIGN KEY (member_id) REFERENCES gym_members(id)
        ON UPDATE CASCADE ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE crm_leads (
    id BIGINT NOT NULL AUTO_INCREMENT,
    tenant_id BIGINT NOT NULL,
    company_name VARCHAR(180) NOT NULL,
    contact_name VARCHAR(160) NOT NULL,
    email VARCHAR(255) NOT NULL,
    phone VARCHAR(20),
    stage ENUM('NEW', 'CONTACTED', 'DEMO', 'PROPOSAL', 'WON', 'LOST') NOT NULL DEFAULT 'NEW',
    value DECIMAL(12,2) NOT NULL DEFAULT 0,
    source VARCHAR(120) NOT NULL DEFAULT 'MANUAL',
    next_follow_up DATE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    KEY idx_crm_leads_tenant_id (tenant_id),
    KEY idx_crm_leads_email (email),
    KEY idx_crm_leads_stage (stage),
    CONSTRAINT fk_crm_leads_tenant FOREIGN KEY (tenant_id) REFERENCES tenants(id)
        ON UPDATE CASCADE ON DELETE RESTRICT,
    CONSTRAINT chk_crm_leads_value_non_negative CHECK (value >= 0)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE crm_activities (
    id BIGINT NOT NULL AUTO_INCREMENT,
    tenant_id BIGINT NOT NULL,
    lead_id BIGINT NOT NULL,
    activity_type ENUM('NOTE', 'EMAIL', 'CALL', 'TASK') NOT NULL,
    body TEXT NOT NULL,
    n8n_workflow_id VARCHAR(255),
    status ENUM('OPEN', 'DONE', 'FAILED') NOT NULL DEFAULT 'OPEN',
    due_at TIMESTAMP NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    KEY idx_crm_activities_tenant_id (tenant_id),
    KEY idx_crm_activities_status (status),
    CONSTRAINT fk_crm_activities_tenant FOREIGN KEY (tenant_id) REFERENCES tenants(id)
        ON UPDATE CASCADE ON DELETE RESTRICT,
    CONSTRAINT fk_crm_activities_lead FOREIGN KEY (lead_id) REFERENCES crm_leads(id)
        ON UPDATE CASCADE ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE subscription_plans (
    id BIGINT NOT NULL AUTO_INCREMENT,
    tenant_id BIGINT NOT NULL,
    code ENUM('BASIC', 'PRO', 'ENTERPRISE') NOT NULL,
    name VARCHAR(120) NOT NULL,
    monthly_price DECIMAL(10,2) NOT NULL,
    product_limit INT NOT NULL,
    agent_limit INT NOT NULL,
    razorpay_plan_id VARCHAR(255),
    status ENUM('ACTIVE', 'INACTIVE') NOT NULL DEFAULT 'ACTIVE',
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    UNIQUE KEY uk_subscription_plans_tenant_code (tenant_id, code),
    KEY idx_subscription_plans_tenant_id (tenant_id),
    KEY idx_subscription_plans_status (status),
    CONSTRAINT fk_subscription_plans_tenant FOREIGN KEY (tenant_id) REFERENCES tenants(id)
        ON UPDATE CASCADE ON DELETE RESTRICT,
    CONSTRAINT chk_subscription_plans_price_non_negative CHECK (monthly_price >= 0)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE social_posts (
    id BIGINT NOT NULL AUTO_INCREMENT,
    tenant_id BIGINT NOT NULL,
    platform ENUM('INSTAGRAM', 'FACEBOOK', 'LINKEDIN') NOT NULL DEFAULT 'INSTAGRAM',
    prompt VARCHAR(500) NOT NULL,
    caption TEXT NOT NULL,
    image_prompt VARCHAR(500),
    image_url VARCHAR(500),
    status ENUM('DRAFT', 'SCHEDULED', 'PUBLISHED', 'FAILED') NOT NULL DEFAULT 'DRAFT',
    scheduled_at TIMESTAMP NULL,
    published_at TIMESTAMP NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    KEY idx_social_posts_tenant_id (tenant_id),
    KEY idx_social_posts_status (status),
    CONSTRAINT fk_social_posts_tenant FOREIGN KEY (tenant_id) REFERENCES tenants(id)
        ON UPDATE CASCADE ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE content_posts (
    id BIGINT NOT NULL AUTO_INCREMENT,
    tenant_id BIGINT NOT NULL,
    title VARCHAR(255) NOT NULL,
    topic VARCHAR(255) NOT NULL,
    markdown MEDIUMTEXT NOT NULL,
    wordpress_post_id VARCHAR(120),
    status ENUM('DRAFT', 'PUBLISHED', 'FAILED') NOT NULL DEFAULT 'DRAFT',
    published_at TIMESTAMP NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    KEY idx_content_posts_tenant_id (tenant_id),
    KEY idx_content_posts_status (status),
    CONSTRAINT fk_content_posts_tenant FOREIGN KEY (tenant_id) REFERENCES tenants(id)
        ON UPDATE CASCADE ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE ai_agent_jobs (
    id BIGINT NOT NULL AUTO_INCREMENT,
    tenant_id BIGINT NOT NULL,
    agent_type ENUM('SOCIAL_MEDIA', 'CONTENT') NOT NULL,
    entity_type VARCHAR(80) NOT NULL,
    entity_id BIGINT NOT NULL,
    status ENUM('QUEUED', 'RUNNING', 'DONE', 'FAILED') NOT NULL DEFAULT 'QUEUED',
    error_message VARCHAR(500),
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    KEY idx_ai_agent_jobs_tenant_id (tenant_id),
    KEY idx_ai_agent_jobs_status (status),
    CONSTRAINT fk_ai_agent_jobs_tenant FOREIGN KEY (tenant_id) REFERENCES tenants(id)
        ON UPDATE CASCADE ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
