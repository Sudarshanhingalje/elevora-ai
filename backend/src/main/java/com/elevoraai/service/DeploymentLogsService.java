package com.elevoraai.service;

import com.elevoraai.config.SecurityConfig.JwtPrincipal;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.util.List;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;

@Service
public class DeploymentLogsService {

    private final JdbcTemplate jdbcTemplate;

    public DeploymentLogsService(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    public void log(Long tenantId, Long deploymentId, String logLine) {
        jdbcTemplate.update(
                "INSERT INTO deployment_logs (tenant_id, deployment_id, log_line) VALUES (?, ?, ?)",
                tenantId,
                deploymentId,
                logLine);
    }

    public List<LogLineResponse> getLogs(JwtPrincipal principal, Long deploymentId) {
        return jdbcTemplate.query(
                "SELECT id, deployment_id, tenant_id, log_line, created_at FROM deployment_logs "
                        + "WHERE tenant_id = ? AND deployment_id = ? ORDER BY id ASC",
                this::mapLogLine,
                principal.tenantId(),
                deploymentId);
    }

    private LogLineResponse mapLogLine(ResultSet rs, int rowNum) throws SQLException {
        return new LogLineResponse(
                rs.getLong("id"),
                rs.getLong("deployment_id"),
                rs.getLong("tenant_id"),
                rs.getString("log_line"),
                rs.getTimestamp("created_at").toInstant());
    }

    public record LogLineResponse(
            Long id,
            Long deploymentId,
            Long tenantId,
            String logLine,
            java.time.Instant createdAt) {
    }
}
