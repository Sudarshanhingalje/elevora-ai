package com.elevoraai.service;

import com.elevoraai.config.SecurityConfig.JwtPrincipal;
import java.math.BigDecimal;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.util.List;
import java.util.Locale;
import org.springframework.http.HttpStatus;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

@Service
public class AgentMonitoringService {

    private final JdbcTemplate jdbcTemplate;

    public AgentMonitoringService(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    public List<AgentMonitorResponse> listAgents(JwtPrincipal principal) {
        seedAgentMonitors(principal.tenantId());
        return jdbcTemplate.query(
                "SELECT id, tenant_id, agent_name, status, success_rate, total_runs, errors_count, last_run_at "
                        + "FROM agent_monitors WHERE tenant_id = ? ORDER BY id ASC",
                this::mapAgentMonitor,
                principal.tenantId());
    }

    @Transactional
    public void recordJobRun(Long tenantId, String agentName, boolean success, String errorMessage) {
        seedAgentMonitors(tenantId);
        String status = success ? "SUCCESS" : "FAILED";
        int errorIncrement = success ? 0 : 1;

        jdbcTemplate.update(
                "UPDATE agent_monitors SET status = ?, total_runs = total_runs + 1, "
                        + "errors_count = errors_count + ?, last_run_at = CURRENT_TIMESTAMP "
                        + "WHERE tenant_id = ? AND UPPER(agent_name) = ?",
                status,
                errorIncrement,
                tenantId,
                agentName.trim().toUpperCase(Locale.ROOT));

        // Recompute success rate: (total_runs - errors_count) / total_runs * 100
        jdbcTemplate.update(
                "UPDATE agent_monitors SET success_rate = "
                        + "CASE WHEN total_runs = 0 THEN 100.00 "
                        + "ELSE ROUND(((total_runs - errors_count) / total_runs) * 100, 2) END "
                        + "WHERE tenant_id = ? AND UPPER(agent_name) = ?",
                tenantId,
                agentName.trim().toUpperCase(Locale.ROOT));
    }

    private void seedAgentMonitors(Long tenantId) {
        Integer count = jdbcTemplate.queryForObject(
                "SELECT COUNT(*) FROM agent_monitors WHERE tenant_id = ?",
                Integer.class,
                tenantId);
        if (count != null && count > 0) {
            return;
        }
        jdbcTemplate.update(
                "INSERT INTO agent_monitors (tenant_id, agent_name, status, success_rate, total_runs, errors_count, last_run_at) VALUES "
                        + "(?, 'Content Publisher Agent', 'IDLE', 100.00, 0, 0, NULL), "
                        + "(?, 'Customer Support Agent', 'IDLE', 100.00, 0, 0, NULL), "
                        + "(?, 'Lead Qualifier Agent', 'IDLE', 100.00, 0, 0, NULL), "
                        + "(?, 'Image Generation Agent', 'IDLE', 100.00, 0, 0, NULL)",
                tenantId, tenantId, tenantId, tenantId);
    }

    private AgentMonitorResponse mapAgentMonitor(ResultSet rs, int rowNum) throws SQLException {
        return new AgentMonitorResponse(
                rs.getLong("id"),
                rs.getLong("tenant_id"),
                rs.getString("agent_name"),
                rs.getString("status"),
                rs.getBigDecimal("success_rate"),
                rs.getInt("total_runs"),
                rs.getInt("errors_count"),
                rs.getTimestamp("last_run_at") == null ? null : rs.getTimestamp("last_run_at").toInstant());
    }

    public record AgentMonitorResponse(
            Long id,
            Long tenantId,
            String agentName,
            String status,
            BigDecimal success_rate,
            int totalRuns,
            int errorsCount,
            java.time.Instant lastRunAt) {
    }
}
