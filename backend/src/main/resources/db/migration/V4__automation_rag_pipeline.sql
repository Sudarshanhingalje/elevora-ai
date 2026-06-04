CREATE TABLE automation_workflows (
    id BIGINT NOT NULL AUTO_INCREMENT,
    tenant_id BIGINT NOT NULL,
    name VARCHAR(160) NOT NULL,
    workflow_type ENUM('WHATSAPP_REMINDER', 'EMAIL_FOLLOWUP', 'CRM_SYNC') NOT NULL,
    n8n_webhook_url VARCHAR(500) NOT NULL,
    status ENUM('ACTIVE', 'PAUSED', 'FAILED') NOT NULL DEFAULT 'ACTIVE',
    last_run_at TIMESTAMP NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    KEY idx_automation_workflows_tenant_id (tenant_id),
    KEY idx_automation_workflows_status (status),
    KEY idx_automation_workflows_type (workflow_type),
    CONSTRAINT fk_automation_workflows_tenant FOREIGN KEY (tenant_id) REFERENCES tenants(id)
        ON UPDATE CASCADE ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE automation_events (
    id BIGINT NOT NULL AUTO_INCREMENT,
    tenant_id BIGINT NOT NULL,
    workflow_id BIGINT NOT NULL,
    entity_type VARCHAR(80) NOT NULL,
    entity_id BIGINT NOT NULL,
    payload JSON NOT NULL,
    status ENUM('QUEUED', 'SENT', 'FAILED') NOT NULL DEFAULT 'QUEUED',
    error_message VARCHAR(500),
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    sent_at TIMESTAMP NULL,
    PRIMARY KEY (id),
    KEY idx_automation_events_tenant_id (tenant_id),
    KEY idx_automation_events_status (status),
    KEY idx_automation_events_entity (entity_type, entity_id),
    CONSTRAINT fk_automation_events_tenant FOREIGN KEY (tenant_id) REFERENCES tenants(id)
        ON UPDATE CASCADE ON DELETE RESTRICT,
    CONSTRAINT fk_automation_events_workflow FOREIGN KEY (workflow_id) REFERENCES automation_workflows(id)
        ON UPDATE CASCADE ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE knowledge_documents (
    id BIGINT NOT NULL AUTO_INCREMENT,
    tenant_id BIGINT NOT NULL,
    title VARCHAR(255) NOT NULL,
    source_type ENUM('PRODUCT', 'MANUAL', 'URL') NOT NULL DEFAULT 'MANUAL',
    source_ref VARCHAR(500),
    status ENUM('INDEXED', 'FAILED') NOT NULL DEFAULT 'INDEXED',
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    KEY idx_knowledge_documents_tenant_id (tenant_id),
    KEY idx_knowledge_documents_status (status),
    CONSTRAINT fk_knowledge_documents_tenant FOREIGN KEY (tenant_id) REFERENCES tenants(id)
        ON UPDATE CASCADE ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE knowledge_chunks (
    id BIGINT NOT NULL AUTO_INCREMENT,
    tenant_id BIGINT NOT NULL,
    document_id BIGINT NOT NULL,
    qdrant_point_id VARCHAR(80) NOT NULL,
    chunk_index INT NOT NULL,
    content TEXT NOT NULL,
    token_count INT NOT NULL DEFAULT 0,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    UNIQUE KEY uk_knowledge_chunks_tenant_point (tenant_id, qdrant_point_id),
    KEY idx_knowledge_chunks_tenant_id (tenant_id),
    KEY idx_knowledge_chunks_document_id (document_id),
    CONSTRAINT fk_knowledge_chunks_tenant FOREIGN KEY (tenant_id) REFERENCES tenants(id)
        ON UPDATE CASCADE ON DELETE RESTRICT,
    CONSTRAINT fk_knowledge_chunks_document FOREIGN KEY (document_id) REFERENCES knowledge_documents(id)
        ON UPDATE CASCADE ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
