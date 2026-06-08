-- V17__audit_logs.sql
-- Audit Logging System: tracks all sensitive admin actions for security compliance.

CREATE TABLE audit_logs (
    id             BIGINT AUTO_INCREMENT PRIMARY KEY,
    tenant_id      BIGINT          NOT NULL,
    user_id        BIGINT          NULL,           -- NULL for system/anonymous actions
    actor_email    VARCHAR(255)    NOT NULL,
    actor_role     VARCHAR(50)     NOT NULL,
    action         VARCHAR(100)    NOT NULL,       -- e.g. PRODUCT_CREATED, USER_LOGIN, RECIPIENT_BULK_ADD
    entity_type    VARCHAR(100)    NULL,           -- e.g. PRODUCT, CAMPAIGN_RECIPIENT, AUTH
    entity_id      VARCHAR(255)    NULL,           -- the ID of the affected record
    description    TEXT            NULL,           -- human-readable summary
    ip_address     VARCHAR(45)     NULL,
    status         VARCHAR(20)     NOT NULL DEFAULT 'SUCCESS', -- SUCCESS | FAILURE
    created_at     TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP,

    KEY idx_audit_tenant    (tenant_id),
    KEY idx_audit_user      (user_id),
    KEY idx_audit_action    (action),
    KEY idx_audit_created   (created_at),
    KEY idx_audit_entity    (entity_type, entity_id(64))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
