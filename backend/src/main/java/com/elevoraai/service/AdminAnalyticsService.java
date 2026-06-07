package com.elevoraai.service;

import java.math.BigDecimal;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.util.List;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;

/**
 * Admin-level analytics aggregating KPIs for the entire tenant scope.
 * All queries carry tenant_id so no cross-tenant data leaks.
 */
@Service
public class AdminAnalyticsService {

    private final JdbcTemplate jdbcTemplate;

    public AdminAnalyticsService(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    // ─── Overview KPIs ───────────────────────────────────────────────────────────

    public AdminKpiSummary kpiSummary(Long tenantId) {
        BigDecimal totalRevenue = jdbcTemplate.queryForObject(
                "SELECT COALESCE(SUM(amount), 0) FROM orders WHERE tenant_id = ? AND payment_status = 'PAID'",
                BigDecimal.class, tenantId);

        BigDecimal revenueThisMonth = jdbcTemplate.queryForObject(
                "SELECT COALESCE(SUM(amount), 0) FROM orders "
                        + "WHERE tenant_id = ? AND payment_status = 'PAID' "
                        + "AND DATE_FORMAT(created_at, '%Y-%m') = DATE_FORMAT(CURRENT_DATE(), '%Y-%m')",
                BigDecimal.class, tenantId);

        Long totalOrders = jdbcTemplate.queryForObject(
                "SELECT COUNT(1) FROM orders WHERE tenant_id = ? AND payment_status = 'PAID'",
                Long.class, tenantId);

        Long totalUsers = jdbcTemplate.queryForObject(
                "SELECT COUNT(1) FROM users WHERE tenant_id = ? AND active = TRUE",
                Long.class, tenantId);

        Long activeDeployments = jdbcTemplate.queryForObject(
                "SELECT COUNT(1) FROM deployments WHERE tenant_id = ? AND status = 'RUNNING'",
                Long.class, tenantId);

        Long openTickets = jdbcTemplate.queryForObject(
                "SELECT COUNT(1) FROM support_tickets WHERE tenant_id = ? AND status = 'OPEN'",
                Long.class, tenantId);

        Long activeSubscriptions = jdbcTemplate.queryForObject(
                "SELECT COUNT(1) FROM subscriptions WHERE tenant_id = ? AND status = 'ACTIVE'",
                Long.class, tenantId);

        return new AdminKpiSummary(
                safe(totalRevenue), safe(revenueThisMonth), safe(totalOrders),
                safe(totalUsers), safe(activeDeployments), safe(openTickets), safe(activeSubscriptions));
    }

    // ─── Subscription Plan Breakdown ────────────────────────────────────────────

    public List<PlanBreakdown> subscriptionPlans(Long tenantId) {
        return jdbcTemplate.query(
                "SELECT plan, COUNT(*) AS count, SUM(CASE WHEN status = 'ACTIVE' THEN 1 ELSE 0 END) AS active_count "
                        + "FROM subscriptions WHERE tenant_id = ? GROUP BY plan ORDER BY count DESC",
                this::mapPlanBreakdown,
                tenantId);
    }

    // ─── Monthly Revenue Growth ──────────────────────────────────────────────────

    public List<MonthlyGrowth> monthlyGrowth(Long tenantId, int months) {
        return jdbcTemplate.query(
                "SELECT STR_TO_DATE(DATE_FORMAT(created_at, '%Y-%m-01'), '%Y-%m-%d') AS month, "
                        + "  COALESCE(SUM(amount), 0) AS revenue, "
                        + "  COUNT(*)                 AS orders "
                        + "FROM orders "
                        + "WHERE tenant_id = ? AND payment_status = 'PAID' "
                        + "  AND created_at >= NOW() - INTERVAL ? MONTH "
                        + "GROUP BY STR_TO_DATE(DATE_FORMAT(created_at, '%Y-%m-01'), '%Y-%m-%d') "
                        + "ORDER BY month",
                this::mapMonthlyGrowth,
                tenantId, months);
    }

    // ─── User Registration Trend ─────────────────────────────────────────────────

    public List<DailySignup> signupTrend(Long tenantId, int days) {
        return jdbcTemplate.query(
                "SELECT DATE(created_at) AS day, COUNT(*) AS signups "
                        + "FROM users WHERE tenant_id = ? AND created_at >= NOW() - INTERVAL ? DAY "
                        + "GROUP BY DATE(created_at) "
                        + "ORDER BY day",
                (rs, row) -> new DailySignup(rs.getDate("day").toLocalDate().toString(), rs.getLong("signups")),
                tenantId, days);
    }

    // ─── Top Customers by Spend ──────────────────────────────────────────────────

    public List<TopCustomer> topCustomers(Long tenantId, int limit) {
        return jdbcTemplate.query(
                "SELECT u.email, COALESCE(u.full_name, u.name, 'N/A') AS name, COALESCE(SUM(o.amount), 0) AS spent, COUNT(o.id) AS orders "
                        + "FROM orders o JOIN users u ON u.tenant_id = o.tenant_id AND u.id = o.user_id "
                        + "WHERE o.tenant_id = ? AND o.payment_status = 'PAID' "
                        + "GROUP BY u.id, u.email, u.full_name, u.name ORDER BY spent DESC LIMIT ?",
                this::mapTopCustomer,
                tenantId, limit);
    }

    // ─── Feedback Rating Distribution ───────────────────────────────────────────

    public List<RatingDistribution> ratingDistribution(Long tenantId) {
        return jdbcTemplate.query(
                "SELECT rating, COUNT(*) AS count FROM feedback WHERE tenant_id = ? GROUP BY rating ORDER BY rating",
                (rs, row) -> new RatingDistribution(rs.getInt("rating"), rs.getLong("count")),
                tenantId);
    }

    // ─── Mappers ────────────────────────────────────────────────────────────────

    private PlanBreakdown mapPlanBreakdown(ResultSet rs, int row) throws SQLException {
        return new PlanBreakdown(rs.getString("plan"), rs.getLong("count"), rs.getLong("active_count"));
    }

    private MonthlyGrowth mapMonthlyGrowth(ResultSet rs, int row) throws SQLException {
        return new MonthlyGrowth(
                rs.getDate("month").toLocalDate().toString(),
                rs.getBigDecimal("revenue"),
                rs.getLong("orders"));
    }

    private TopCustomer mapTopCustomer(ResultSet rs, int row) throws SQLException {
        return new TopCustomer(rs.getString("email"), rs.getString("name"),
                rs.getBigDecimal("spent"), rs.getLong("orders"));
    }

    // ─── Helpers ────────────────────────────────────────────────────────────────

    private static BigDecimal safe(BigDecimal v) { return v == null ? BigDecimal.ZERO : v; }
    private static long safe(Long v)              { return v == null ? 0L : v; }

    // ─── Records ────────────────────────────────────────────────────────────────

    public record AdminKpiSummary(
            BigDecimal totalRevenue, BigDecimal revenueThisMonth,
            long totalOrders, long totalUsers,
            long activeDeployments, long openTickets, long activeSubscriptions) {}

    public record PlanBreakdown(String plan, long total, long active) {}

    public record MonthlyGrowth(String month, BigDecimal revenue, long orders) {}

    public record DailySignup(String day, long signups) {}

    public record TopCustomer(String email, String name, BigDecimal spent, long orders) {}

    public record RatingDistribution(int rating, long count) {}
}
