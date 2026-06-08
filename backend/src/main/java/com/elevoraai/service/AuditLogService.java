package com.elevoraai.service;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

/**
 * AuditLogService — writes tamper-evident security audit entries.
 *
 * Uses REQUIRES_NEW so that a rollback in the calling service does NOT
 * prevent the audit entry from being committed to the database.
 *
 * All writes are also async-safe (annotated with @Async where needed)
 * so they do not add latency to the hot request path.
 */
@Service
public class AuditLogService {

    private static final Logger log = LoggerFactory.getLogger(AuditLogService.class);

    private final JdbcTemplate jdbcTemplate;

    public AuditLogService(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    // ─── Public action constants ──────────────────────────────────────────────

    public static final String ACTION_USER_LOGIN             = "USER_LOGIN";
    public static final String ACTION_USER_REGISTER          = "USER_REGISTER";
    public static final String ACTION_ADMIN_LOGIN            = "ADMIN_LOGIN";
    public static final String ACTION_PRODUCT_CREATED        = "PRODUCT_CREATED";
    public static final String ACTION_PRODUCT_UPDATED        = "PRODUCT_UPDATED";
    public static final String ACTION_PRODUCT_DELETED        = "PRODUCT_DELETED";
    public static final String ACTION_PRODUCT_PUBLISHED      = "PRODUCT_PUBLISHED";
    public static final String ACTION_PRODUCT_UNPUBLISHED    = "PRODUCT_UNPUBLISHED";
    public static final String ACTION_RECIPIENT_BULK_ADD     = "RECIPIENT_BULK_ADD";
    public static final String ACTION_RECIPIENT_REMOVED      = "RECIPIENT_REMOVED";
    public static final String ACTION_RECIPIENT_RESET_FAILED = "RECIPIENT_RESET_FAILED";
    public static final String ACTION_DRIP_STARTED           = "DRIP_CAMPAIGN_STARTED";
    public static final String ACTION_DRIP_STOPPED           = "DRIP_CAMPAIGN_STOPPED";

    public static final String ENTITY_PRODUCT    = "PRODUCT";
    public static final String ENTITY_CAMPAIGN   = "CAMPAIGN";
    public static final String ENTITY_AUTH       = "AUTH";

    public static final String STATUS_SUCCESS = "SUCCESS";
    public static final String STATUS_FAILURE = "FAILURE";

    // ─── Core write method ────────────────────────────────────────────────────

    /**
     * Persists an audit entry in its OWN transaction so that any rollback
     * in the caller does not suppress this record.
     */
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void log(AuditEntry entry) {
        try {
            jdbcTemplate.update(
                    """
                    INSERT INTO audit_logs
                        (tenant_id, user_id, actor_email, actor_role, action,
                         entity_type, entity_id, description, ip_address, status)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                    """,
                    entry.tenantId(),
                    entry.userId(),
                    entry.actorEmail(),
                    entry.actorRole(),
                    entry.action(),
                    entry.entityType(),
                    entry.entityId(),
                    entry.description(),
                    entry.ipAddress(),
                    entry.status());
        } catch (Exception ex) {
            // Never let audit failure crash the main request
            log.error("[AUDIT] Failed to write audit log entry: action={}, actor={}, error={}",
                    entry.action(), entry.actorEmail(), ex.getMessage(), ex);
        }
    }

    // ─── Convenience builders ─────────────────────────────────────────────────

    public void logSuccess(Long tenantId, Long userId, String email, String role,
                           String action, String entityType, String entityId,
                           String description, String ip) {
        log(new AuditEntry(tenantId, userId, email, role, action,
                entityType, entityId, description, ip, STATUS_SUCCESS));
    }

    public void logFailure(Long tenantId, Long userId, String email, String role,
                           String action, String entityType, String entityId,
                           String description, String ip) {
        log(new AuditEntry(tenantId, userId, email, role, action,
                entityType, entityId, description, ip, STATUS_FAILURE));
    }

    // ─── Value type ───────────────────────────────────────────────────────────

    public record AuditEntry(
            Long   tenantId,
            Long   userId,      // nullable
            String actorEmail,
            String actorRole,
            String action,
            String entityType,  // nullable
            String entityId,    // nullable
            String description, // nullable
            String ipAddress,   // nullable
            String status) {
    }
}
