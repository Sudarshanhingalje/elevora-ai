package com.elevoraai.service;

import java.math.BigDecimal;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.time.LocalDate;
import java.time.YearMonth;
import java.util.List;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;

/**
 * Provides per-tenant revenue analytics: monthly MRR, top products, and
 * cumulative revenue trends. All queries are strictly tenant-scoped.
 */
@Service
public class RevenueService {

    private final JdbcTemplate jdbcTemplate;

    public RevenueService(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    /**
     * Monthly revenue breakdown for the last N months.
     */
    public List<MonthlyRevenue> monthlyRevenue(Long tenantId, int months) {
        return jdbcTemplate.query(
                "SELECT STR_TO_DATE(DATE_FORMAT(created_at, '%Y-%m-01'), '%Y-%m-%d') AS month, "
                        + "  COALESCE(SUM(amount), 0)            AS revenue, "
                        + "  COUNT(*)                             AS order_count "
                        + "FROM orders "
                        + "WHERE tenant_id = ? AND payment_status = 'PAID' "
                        + "  AND created_at >= NOW() - INTERVAL ? MONTH "
                        + "GROUP BY STR_TO_DATE(DATE_FORMAT(created_at, '%Y-%m-01'), '%Y-%m-%d') "
                        + "ORDER BY month",
                this::mapMonthlyRevenue,
                tenantId,
                months);
    }

    /**
     * Top revenue-generating products for the tenant.
     */
    public List<ProductRevenue> topProducts(Long tenantId, int limit) {
        return jdbcTemplate.query(
                "SELECT p.name, COALESCE(SUM(o.amount), 0) AS revenue, COUNT(o.id) AS sales "
                        + "FROM orders o "
                        + "JOIN products p ON p.tenant_id = o.tenant_id AND p.id = o.product_id "
                        + "WHERE o.tenant_id = ? AND o.payment_status = 'PAID' "
                        + "GROUP BY p.id, p.name ORDER BY revenue DESC LIMIT ?",
                this::mapProductRevenue,
                tenantId,
                limit);
    }

    /**
     * Total revenue and average order value for the tenant.
     */
    public RevenueSummary summary(Long tenantId) {
        BigDecimal total = jdbcTemplate.queryForObject(
                "SELECT COALESCE(SUM(amount), 0) FROM orders WHERE tenant_id = ? AND payment_status = 'PAID'",
                BigDecimal.class, tenantId);
        BigDecimal avg = jdbcTemplate.queryForObject(
                "SELECT COALESCE(AVG(amount), 0) FROM orders WHERE tenant_id = ? AND payment_status = 'PAID'",
                BigDecimal.class, tenantId);
        Long count = jdbcTemplate.queryForObject(
                "SELECT COUNT(1) FROM orders WHERE tenant_id = ? AND payment_status = 'PAID'",
                Long.class, tenantId);
        return new RevenueSummary(
                total == null ? BigDecimal.ZERO : total,
                avg == null ? BigDecimal.ZERO : avg,
                count == null ? 0L : count);
    }

    // ─── Mappers ────────────────────────────────────────────────────────────────

    private MonthlyRevenue mapMonthlyRevenue(ResultSet rs, int row) throws SQLException {
        return new MonthlyRevenue(
                rs.getDate("month").toLocalDate(),
                rs.getBigDecimal("revenue"),
                rs.getLong("order_count"));
    }

    private ProductRevenue mapProductRevenue(ResultSet rs, int row) throws SQLException {
        return new ProductRevenue(
                rs.getString("name"),
                rs.getBigDecimal("revenue"),
                rs.getLong("sales"));
    }

    // ─── Records ────────────────────────────────────────────────────────────────

    public record MonthlyRevenue(LocalDate month, BigDecimal revenue, Long orderCount) {}

    public record ProductRevenue(String productName, BigDecimal revenue, Long sales) {}

    public record RevenueSummary(BigDecimal totalRevenue, BigDecimal avgOrderValue, Long totalOrders) {}
}
