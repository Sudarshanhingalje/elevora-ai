package com.elevoraai.service;

import java.sql.ResultSet;
import java.sql.SQLException;
import java.time.Instant;
import java.util.List;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class UserActivityService {

    private final JdbcTemplate jdbcTemplate;

    public UserActivityService(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    @Transactional
    public void log(Long tenantId, Long userId, String action, String entityType, Long entityId, String ipAddress) {
        jdbcTemplate.update(
                "INSERT INTO activity_logs (tenant_id, user_id, action, entity_type, entity_id, ip_address) "
                        + "VALUES (?, ?, ?, ?, ?, ?)",
                tenantId,
                userId,
                action,
                entityType,
                entityId,
                ipAddress != null ? ipAddress : "127.0.0.1");
    }

    public List<ActivityLogResponse> listLogs(Long tenantId, Long userId) {
        return jdbcTemplate.query(
                "SELECT id, tenant_id, user_id, action, entity_type, entity_id, ip_address, created_at "
                        + "FROM activity_logs WHERE tenant_id = ? AND user_id = ? ORDER BY created_at DESC LIMIT 100",
                this::mapLog,
                tenantId,
                userId);
    }

    private ActivityLogResponse mapLog(ResultSet rs, int rowNum) throws SQLException {
        return new ActivityLogResponse(
                rs.getLong("id"),
                rs.getLong("tenant_id"),
                rs.getObject("user_id") == null ? null : rs.getLong("user_id"),
                rs.getString("action"),
                rs.getString("entity_type"),
                rs.getObject("entity_id") == null ? null : rs.getLong("entity_id"),
                rs.getString("ip_address"),
                rs.getTimestamp("created_at").toInstant());
    }

    public record ActivityLogResponse(Long id, Long tenantId, Long userId, String action, String entityType, Long entityId, String ipAddress, Instant createdAt) {
    }
}
