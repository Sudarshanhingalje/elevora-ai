package com.elevoraai.service;

import java.math.BigDecimal;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.time.LocalDate;
import java.time.ZoneId;
import java.util.List;
import java.util.Optional;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;

@Service
public class DashboardService {

    private static final ZoneId APP_ZONE = ZoneId.of("Asia/Kolkata");

    private final JdbcTemplate jdbcTemplate;

    public DashboardService(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    public UserDashboardResponse userDashboard(Long tenantId, Long userId, String role) {
        return new UserDashboardResponse(
                role,
                activeOrders(tenantId, userId),
                currentSubscription(tenantId, userId).orElse(null),
                deployedProducts(tenantId, userId));
    }

    public AdminDashboardResponse adminDashboard(Long tenantId, String role) {
        return new AdminDashboardResponse(
                role,
                totalTenantsInScope(tenantId),
                totalRevenue(tenantId),
                activeDeploymentCount(tenantId),
                recentOrders(tenantId),
                activeDeployments(tenantId));
    }

    private List<OrderSummary> activeOrders(Long tenantId, Long userId) {
        return jdbcTemplate.query(
                "SELECT o.id, p.name AS product_name, o.amount, o.currency, o.payment_status, o.status, "
                        + "o.deployment_url, d.subdomain, d.deployed_at "
                        + "FROM orders o "
                        + "JOIN products p ON p.tenant_id = o.tenant_id AND p.id = o.product_id "
                        + "LEFT JOIN deployments d ON d.tenant_id = o.tenant_id AND d.order_id = o.id "
                        + "WHERE o.tenant_id = ? AND o.user_id = ? "
                        + "ORDER BY o.updated_at DESC, o.id DESC",
                this::mapOrderSummary,
                tenantId,
                userId);
    }

    private Optional<SubscriptionSummary> currentSubscription(Long tenantId, Long userId) {
        List<SubscriptionSummary> rows = jdbcTemplate.query(
                "SELECT plan, status, start_date, end_date "
                        + "FROM subscriptions WHERE tenant_id = ? AND user_id = ? "
                        + "ORDER BY start_date DESC, id DESC LIMIT 1",
                (rs, rowNum) -> new SubscriptionSummary(
                        rs.getString("plan"),
                        rs.getString("status"),
                        rs.getDate("start_date").toLocalDate(),
                        rs.getDate("end_date") == null ? null : rs.getDate("end_date").toLocalDate()),
                tenantId,
                userId);
        return rows.stream().findFirst();
    }

    private List<DeploymentSummary> deployedProducts(Long tenantId, Long userId) {
        return jdbcTemplate.query(
                "SELECT p.name AS product_name, d.status, d.subdomain, d.container_id, d.deployed_at "
                        + "FROM deployments d "
                        + "JOIN orders o ON o.tenant_id = d.tenant_id AND o.id = d.order_id "
                        + "JOIN products p ON p.tenant_id = o.tenant_id AND p.id = o.product_id "
                        + "WHERE d.tenant_id = ? AND o.user_id = ? "
                        + "ORDER BY d.updated_at DESC, d.id DESC",
                this::mapDeploymentSummary,
                tenantId,
                userId);
    }

    private long totalTenantsInScope(Long tenantId) {
        Long count = jdbcTemplate.queryForObject(
                "SELECT COUNT(1) FROM tenants WHERE tenant_id = ? AND id = ?",
                Long.class,
                tenantId,
                tenantId);
        return count == null ? 0 : count;
    }

    private BigDecimal totalRevenue(Long tenantId) {
        BigDecimal revenue = jdbcTemplate.queryForObject(
                "SELECT COALESCE(SUM(amount), 0) FROM orders WHERE tenant_id = ? AND payment_status = 'PAID'",
                BigDecimal.class,
                tenantId);
        return revenue == null ? BigDecimal.ZERO : revenue;
    }

    private long activeDeploymentCount(Long tenantId) {
        Long count = jdbcTemplate.queryForObject(
                "SELECT COUNT(1) FROM deployments WHERE tenant_id = ? AND status = 'RUNNING'",
                Long.class,
                tenantId);
        return count == null ? 0 : count;
    }

    private List<OrderSummary> recentOrders(Long tenantId) {
        return jdbcTemplate.query(
                "SELECT o.id, p.name AS product_name, o.amount, o.currency, o.payment_status, o.status, "
                        + "o.deployment_url, d.subdomain, d.deployed_at "
                        + "FROM orders o "
                        + "JOIN products p ON p.tenant_id = o.tenant_id AND p.id = o.product_id "
                        + "LEFT JOIN deployments d ON d.tenant_id = o.tenant_id AND d.order_id = o.id "
                        + "WHERE o.tenant_id = ? ORDER BY o.updated_at DESC, o.id DESC LIMIT 5",
                this::mapOrderSummary,
                tenantId);
    }

    public List<OrderSummary> paginatedOrders(Long tenantId, int page, int size) {
        int offset = page * size;
        return jdbcTemplate.query(
                "SELECT o.id, p.name AS product_name, o.amount, o.currency, o.payment_status, o.status, "
                        + "o.deployment_url, d.subdomain, d.deployed_at "
                        + "FROM orders o "
                        + "JOIN products p ON p.tenant_id = o.tenant_id AND p.id = o.product_id "
                        + "LEFT JOIN deployments d ON d.tenant_id = o.tenant_id AND d.order_id = o.id "
                        + "WHERE o.tenant_id = ? "
                        + "ORDER BY o.updated_at DESC, o.id DESC "
                        + "LIMIT ? OFFSET ?",
                this::mapOrderSummary,
                tenantId,
                size,
                offset);
    }

    private List<DeploymentSummary> activeDeployments(Long tenantId) {
        return jdbcTemplate.query(
                "SELECT p.name AS product_name, d.status, d.subdomain, d.container_id, d.deployed_at "
                        + "FROM deployments d "
                        + "JOIN orders o ON o.tenant_id = d.tenant_id AND o.id = d.order_id "
                        + "JOIN products p ON p.tenant_id = o.tenant_id AND p.id = o.product_id "
                        + "WHERE d.tenant_id = ? AND d.status = 'RUNNING' "
                        + "ORDER BY d.updated_at DESC, d.id DESC",
                this::mapDeploymentSummary,
                tenantId);
    }

    private OrderSummary mapOrderSummary(ResultSet rs, int rowNum) throws SQLException {
        return new OrderSummary(
                rs.getLong("id"),
                rs.getString("product_name"),
                rs.getBigDecimal("amount"),
                rs.getString("currency"),
                rs.getString("payment_status"),
                rs.getString("status"),
                rs.getString("deployment_url"),
                rs.getString("subdomain"),
                rs.getTimestamp("deployed_at") == null ? null : rs.getTimestamp("deployed_at").toInstant().atZone(APP_ZONE).toLocalDate());
    }

    private DeploymentSummary mapDeploymentSummary(ResultSet rs, int rowNum) throws SQLException {
        return new DeploymentSummary(
                rs.getString("product_name"),
                rs.getString("status"),
                rs.getString("subdomain"),
                rs.getString("container_id"),
                rs.getTimestamp("deployed_at") == null ? null : rs.getTimestamp("deployed_at").toInstant().atZone(APP_ZONE).toLocalDate());
    }

    public record UserDashboardResponse(String role, List<OrderSummary> activeOrders, SubscriptionSummary subscription, List<DeploymentSummary> deployments) {
    }

    public record AdminDashboardResponse(String role, long totalTenants, BigDecimal totalRevenue, long activeDeployments, List<OrderSummary> recentOrders, List<DeploymentSummary> deployments) {
    }

    public record OrderSummary(Long id, String productName, BigDecimal amount, String currency, String paymentStatus, String status, String deploymentUrl, String subdomain, LocalDate deployedDate) {
    }

    public record SubscriptionSummary(String plan, String status, LocalDate startDate, LocalDate endDate) {
    }

    public record DeploymentSummary(String productName, String status, String subdomain, String containerId, LocalDate deployedDate) {
    }
}
