CREATE TABLE billing_events (
    id BIGINT NOT NULL AUTO_INCREMENT,
    tenant_id BIGINT NOT NULL,
    user_id BIGINT,
    event_type VARCHAR(120) NOT NULL,
    provider VARCHAR(40) NOT NULL DEFAULT 'RAZORPAY',
    provider_event_id VARCHAR(255),
    provider_payment_id VARCHAR(255),
    provider_order_id VARCHAR(255),
    provider_subscription_id VARCHAR(255),
    amount DECIMAL(10,2),
    currency CHAR(3) NOT NULL DEFAULT 'INR',
    status VARCHAR(60) NOT NULL,
    payload_json JSON,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    UNIQUE KEY uk_billing_events_provider_event (provider, provider_event_id),
    KEY idx_billing_events_tenant_id (tenant_id),
    KEY idx_billing_events_status (status),
    KEY idx_billing_events_type (event_type),
    CONSTRAINT fk_billing_events_tenant FOREIGN KEY (tenant_id) REFERENCES tenants(id),
    CONSTRAINT fk_billing_events_user FOREIGN KEY (user_id, tenant_id) REFERENCES users(id, tenant_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE invoices (
    id BIGINT NOT NULL AUTO_INCREMENT,
    tenant_id BIGINT NOT NULL,
    user_id BIGINT NOT NULL,
    order_id BIGINT,
    subscription_id BIGINT,
    invoice_number VARCHAR(80) NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    currency CHAR(3) NOT NULL DEFAULT 'INR',
    status ENUM('DRAFT', 'ISSUED', 'PAID', 'VOID') NOT NULL DEFAULT 'ISSUED',
    issued_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    paid_at TIMESTAMP NULL,
    PRIMARY KEY (id),
    UNIQUE KEY uk_invoices_tenant_number (tenant_id, invoice_number),
    KEY idx_invoices_tenant_id (tenant_id),
    KEY idx_invoices_user_id (tenant_id, user_id),
    KEY idx_invoices_status (status),
    CONSTRAINT fk_invoices_tenant FOREIGN KEY (tenant_id) REFERENCES tenants(id),
    CONSTRAINT fk_invoices_user FOREIGN KEY (user_id, tenant_id) REFERENCES users(id, tenant_id),
    CONSTRAINT fk_invoices_order FOREIGN KEY (order_id, tenant_id) REFERENCES orders(id, tenant_id),
    CONSTRAINT fk_invoices_subscription FOREIGN KEY (subscription_id) REFERENCES subscriptions(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE notifications (
    id BIGINT NOT NULL AUTO_INCREMENT,
    tenant_id BIGINT NOT NULL,
    user_id BIGINT,
    channel ENUM('EMAIL', 'IN_APP') NOT NULL,
    title VARCHAR(255) NOT NULL,
    body TEXT NOT NULL,
    status ENUM('QUEUED', 'SENT', 'READ', 'FAILED') NOT NULL DEFAULT 'QUEUED',
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    sent_at TIMESTAMP NULL,
    read_at TIMESTAMP NULL,
    PRIMARY KEY (id),
    KEY idx_notifications_tenant_id (tenant_id),
    KEY idx_notifications_user_id (tenant_id, user_id),
    KEY idx_notifications_status (status),
    CONSTRAINT fk_notifications_tenant FOREIGN KEY (tenant_id) REFERENCES tenants(id),
    CONSTRAINT fk_notifications_user FOREIGN KEY (user_id, tenant_id) REFERENCES users(id, tenant_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE support_tickets (
    id BIGINT NOT NULL AUTO_INCREMENT,
    tenant_id BIGINT NOT NULL,
    user_id BIGINT NOT NULL,
    subject VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    priority ENUM('LOW', 'MEDIUM', 'HIGH', 'URGENT') NOT NULL DEFAULT 'MEDIUM',
    status ENUM('OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED') NOT NULL DEFAULT 'OPEN',
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    KEY idx_support_tickets_tenant_id (tenant_id),
    KEY idx_support_tickets_user_id (tenant_id, user_id),
    KEY idx_support_tickets_status (status),
    CONSTRAINT fk_support_tickets_tenant FOREIGN KEY (tenant_id) REFERENCES tenants(id),
    CONSTRAINT fk_support_tickets_user FOREIGN KEY (user_id, tenant_id) REFERENCES users(id, tenant_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE feedback (
    id BIGINT NOT NULL AUTO_INCREMENT,
    tenant_id BIGINT NOT NULL,
    user_id BIGINT NOT NULL,
    rating TINYINT NOT NULL,
    message TEXT NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    KEY idx_feedback_tenant_id (tenant_id),
    KEY idx_feedback_user_id (tenant_id, user_id),
    CONSTRAINT fk_feedback_tenant FOREIGN KEY (tenant_id) REFERENCES tenants(id),
    CONSTRAINT fk_feedback_user FOREIGN KEY (user_id, tenant_id) REFERENCES users(id, tenant_id),
    CONSTRAINT chk_feedback_rating CHECK (rating BETWEEN 1 AND 5)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE usage_metrics (
    id BIGINT NOT NULL AUTO_INCREMENT,
    tenant_id BIGINT NOT NULL,
    metric_name VARCHAR(120) NOT NULL,
    metric_value DECIMAL(14,2) NOT NULL,
    recorded_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    KEY idx_usage_metrics_tenant_id (tenant_id),
    KEY idx_usage_metrics_name (tenant_id, metric_name),
    CONSTRAINT fk_usage_metrics_tenant FOREIGN KEY (tenant_id) REFERENCES tenants(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
