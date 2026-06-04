package com.elevoraai.service;

import java.sql.ResultSet;
import java.sql.SQLException;
import java.time.Instant;
import java.util.List;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;

/**
 * Tracks per-tenant product usage, active users, deployment health, and
 * AI feature invocation counters. Strictly tenant-scoped – no cross-tenant
 * data is ever returned.
 */
@Service
public class UsageMetricsService {

    private final JdbcTemplate jdbcTemplate;

    public UsageMetricsService(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    /**
     * Active user count (users who logged in within the last 30 days).
     */
    public long activeUsers(Long tenantId) {
        Long count = jdbcTemplate.queryForObject(
                "SELECT COUNT(DISTINCT user_id) FROM user_activity_log "
                        + "WHERE tenant_id = ? AND created_at >= NOW() - INTERVAL 30 DAY",
                Long.class, tenantId);
        return count == null ? 0L : count;
    }

    /**
     * Total registered users for the tenant.
     */
    public long totalUsers(Long tenantId) {
        Long count = jdbcTemplate.queryForObject(
                "SELECT COUNT(1) FROM users WHERE tenant_id = ? AND active = TRUE",
                Long.class, tenantId);
        return count == null ? 0L : count;
    }

    /**
     * Running deployment count.
     */
    public long runningDeployments(Long tenantId) {
        Long count = jdbcTemplate.queryForObject(
                "SELECT COUNT(1) FROM deployments WHERE tenant_id = ? AND status = 'RUNNING'",
                Long.class, tenantId);
        return count == null ? 0L : count;
    }

    /**
     * AI invocation counts grouped by feature name for the last 30 days.
     */
    public List<FeatureUsage> aiFeatureUsage(Long tenantId) {
        return jdbcTemplate.query(
                "SELECT action AS feature, COUNT(*) AS invocations "
                        + "FROM user_activity_log "
                        + "WHERE tenant_id = ? AND created_at >= NOW() - INTERVAL 30 DAY "
                        + "GROUP BY action ORDER BY invocations DESC LIMIT 10",
                this::mapFeatureUsage,
                tenantId);
    }

    /**
     * Open support tickets for the tenant.
     */
    public long openTickets(Long tenantId) {
        Long count = jdbcTemplate.queryForObject(
                "SELECT COUNT(1) FROM support_tickets WHERE tenant_id = ? AND status = 'OPEN'",
                Long.class, tenantId);
        return count == null ? 0L : count;
    }

    /**
     * Daily user activity for the last 14 days.
     */
    public List<DailyActivity> dailyActivity(Long tenantId) {
        return jdbcTemplate.query(
                "SELECT DATE(created_at) AS day, COUNT(*) AS events "
                        + "FROM user_activity_log "
                        + "WHERE tenant_id = ? AND created_at >= NOW() - INTERVAL 14 DAY "
                        + "GROUP BY DATE(created_at) "
                        + "ORDER BY day",
                (rs, row) -> new DailyActivity(
                        rs.getDate("day").toLocalDate().toString(),
                        rs.getLong("events")),
                tenantId);
    }

    // ─── Mappers ────────────────────────────────────────────────────────────────

    private FeatureUsage mapFeatureUsage(ResultSet rs, int row) throws SQLException {
        return new FeatureUsage(rs.getString("feature"), rs.getLong("invocations"));
    }

    // ─── Records ────────────────────────────────────────────────────────────────

    public record FeatureUsage(String feature, Long invocations) {}

    public record DailyActivity(String day, Long events) {}

    public record UsageSummary(
            long totalUsers, long activeUsers, long runningDeployments,
            long openTickets, List<FeatureUsage> topFeatures, List<DailyActivity> dailyActivity) {}
}
