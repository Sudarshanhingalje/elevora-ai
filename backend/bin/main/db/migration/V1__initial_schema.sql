-- Elevora AI initial schema
-- Flyway V1 foundation for multi-tenant marketplace, auth, payments, deployments, and audit logging.

CREATE TABLE tenants (
    id BIGINT NOT NULL AUTO_INCREMENT,
    tenant_id BIGINT NOT NULL,
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(120) NOT NULL,
    plan ENUM('FREE', 'BASIC', 'PRO', 'ENTERPRISE') NOT NULL DEFAULT 'FREE',
    status ENUM('ACTIVE', 'SUSPENDED', 'CANCELLED', 'PENDING') NOT NULL DEFAULT 'ACTIVE',
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    UNIQUE KEY uk_tenants_tenant_id (tenant_id),
    UNIQUE KEY uk_tenants_slug (slug),
    KEY idx_tenants_tenant_id (tenant_id),
    KEY idx_tenants_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE users (
    id BIGINT NOT NULL AUTO_INCREMENT,
    tenant_id BIGINT NOT NULL,
    email VARCHAR(255) NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role ENUM('USER', 'ADMIN', 'SUPER_ADMIN') NOT NULL DEFAULT 'USER',
    otp_code VARCHAR(128),
    otp_expiry TIMESTAMP NULL,
    is_verified BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    UNIQUE KEY uk_users_id_tenant (id, tenant_id),
    UNIQUE KEY uk_users_tenant_email (tenant_id, email),
    KEY idx_users_tenant_id (tenant_id),
    KEY idx_users_email (email),
    KEY idx_users_role (role),
    KEY idx_users_verified (is_verified),
    CONSTRAINT fk_users_tenant FOREIGN KEY (tenant_id) REFERENCES tenants(id)
        ON UPDATE CASCADE ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE products (
    id BIGINT NOT NULL AUTO_INCREMENT,
    tenant_id BIGINT NOT NULL,
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(160) NOT NULL,
    description TEXT,
    price DECIMAL(10,2) NOT NULL,
    category ENUM('AI_WEBSITE', 'AUTOMATION', 'CRM', 'CHATBOT', 'TEMPLATE') NOT NULL,
    demo_url VARCHAR(500),
    docker_image VARCHAR(500),
    status ENUM('DRAFT', 'ACTIVE', 'INACTIVE', 'ARCHIVED') NOT NULL DEFAULT 'DRAFT',
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    UNIQUE KEY uk_products_id_tenant (id, tenant_id),
    UNIQUE KEY uk_products_tenant_slug (tenant_id, slug),
    KEY idx_products_tenant_id (tenant_id),
    KEY idx_products_status (status),
    KEY idx_products_category (category),
    CONSTRAINT fk_products_tenant FOREIGN KEY (tenant_id) REFERENCES tenants(id)
        ON UPDATE CASCADE ON DELETE RESTRICT,
    CONSTRAINT chk_products_price_non_negative CHECK (price >= 0)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE orders (
    id BIGINT NOT NULL AUTO_INCREMENT,
    tenant_id BIGINT NOT NULL,
    user_id BIGINT NOT NULL,
    product_id BIGINT NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    currency CHAR(3) NOT NULL DEFAULT 'INR',
    payment_status ENUM('PENDING', 'PAID', 'FAILED', 'REFUNDED') NOT NULL DEFAULT 'PENDING',
    razorpay_order_id VARCHAR(255),
    razorpay_payment_id VARCHAR(255),
    deployment_url VARCHAR(500),
    status ENUM('PENDING', 'DEPLOYING', 'DEPLOYED', 'FAILED', 'CANCELLED') NOT NULL DEFAULT 'PENDING',
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    UNIQUE KEY uk_orders_id_tenant (id, tenant_id),
    UNIQUE KEY uk_orders_razorpay_order_id (razorpay_order_id),
    UNIQUE KEY uk_orders_razorpay_payment_id (razorpay_payment_id),
    KEY idx_orders_tenant_id (tenant_id),
    KEY idx_orders_user_id (user_id),
    KEY idx_orders_product_id (product_id),
    KEY idx_orders_payment_status (payment_status),
    KEY idx_orders_status (status),
    CONSTRAINT fk_orders_tenant FOREIGN KEY (tenant_id) REFERENCES tenants(id)
        ON UPDATE CASCADE ON DELETE RESTRICT,
    CONSTRAINT fk_orders_user_tenant FOREIGN KEY (user_id, tenant_id) REFERENCES users(id, tenant_id)
        ON UPDATE CASCADE ON DELETE RESTRICT,
    CONSTRAINT fk_orders_product_tenant FOREIGN KEY (product_id, tenant_id) REFERENCES products(id, tenant_id)
        ON UPDATE CASCADE ON DELETE RESTRICT,
    CONSTRAINT chk_orders_amount_positive CHECK (amount >= 0)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE deployments (
    id BIGINT NOT NULL AUTO_INCREMENT,
    order_id BIGINT NOT NULL,
    tenant_id BIGINT NOT NULL,
    subdomain VARCHAR(120) NOT NULL,
    container_id VARCHAR(255),
    status ENUM('PENDING', 'BUILDING', 'RUNNING', 'FAILED', 'STOPPED') NOT NULL DEFAULT 'PENDING',
    deployed_at TIMESTAMP NULL,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    UNIQUE KEY uk_deployments_tenant_subdomain (tenant_id, subdomain),
    UNIQUE KEY uk_deployments_container_id (container_id),
    KEY idx_deployments_tenant_id (tenant_id),
    KEY idx_deployments_order_id (order_id),
    KEY idx_deployments_status (status),
    CONSTRAINT fk_deployments_tenant FOREIGN KEY (tenant_id) REFERENCES tenants(id)
        ON UPDATE CASCADE ON DELETE RESTRICT,
    CONSTRAINT fk_deployments_order_tenant FOREIGN KEY (order_id, tenant_id) REFERENCES orders(id, tenant_id)
        ON UPDATE CASCADE ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE activity_logs (
    id BIGINT NOT NULL AUTO_INCREMENT,
    tenant_id BIGINT NOT NULL,
    user_id BIGINT,
    action VARCHAR(255) NOT NULL,
    entity_type VARCHAR(100),
    entity_id BIGINT,
    ip_address VARCHAR(45) NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    KEY idx_activity_logs_tenant_id (tenant_id),
    KEY idx_activity_logs_user_id (user_id),
    KEY idx_activity_logs_action (action),
    KEY idx_activity_logs_created_at (created_at),
    CONSTRAINT fk_activity_logs_tenant FOREIGN KEY (tenant_id) REFERENCES tenants(id)
        ON UPDATE CASCADE ON DELETE RESTRICT,
    CONSTRAINT fk_activity_logs_user_tenant FOREIGN KEY (user_id, tenant_id) REFERENCES users(id, tenant_id)
        ON UPDATE CASCADE ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE subscriptions (
    id BIGINT NOT NULL AUTO_INCREMENT,
    tenant_id BIGINT NOT NULL,
    user_id BIGINT NOT NULL,
    plan ENUM('BASIC', 'PRO', 'ENTERPRISE') NOT NULL,
    status ENUM('ACTIVE', 'CANCELLED', 'EXPIRED', 'PAST_DUE') NOT NULL DEFAULT 'ACTIVE',
    razorpay_subscription_id VARCHAR(255),
    start_date DATE NOT NULL,
    end_date DATE,
    PRIMARY KEY (id),
    UNIQUE KEY uk_subscriptions_razorpay_subscription_id (razorpay_subscription_id),
    KEY idx_subscriptions_tenant_id (tenant_id),
    KEY idx_subscriptions_user_id (user_id),
    KEY idx_subscriptions_status (status),
    KEY idx_subscriptions_plan (plan),
    CONSTRAINT fk_subscriptions_tenant FOREIGN KEY (tenant_id) REFERENCES tenants(id)
        ON UPDATE CASCADE ON DELETE RESTRICT,
    CONSTRAINT fk_subscriptions_user_tenant FOREIGN KEY (user_id, tenant_id) REFERENCES users(id, tenant_id)
        ON UPDATE CASCADE ON DELETE RESTRICT,
    CONSTRAINT chk_subscriptions_dates CHECK (end_date IS NULL OR end_date >= start_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
