package com.elevoraai.service;

import com.elevoraai.config.SecurityConfig.JwtPrincipal;
import java.math.BigDecimal;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.util.List;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;

@Service
public class AdminDashboardService {

    private final JdbcTemplate jdbcTemplate;

    public AdminDashboardService(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    public AdminDashboardData getAdminDashboardData(JwtPrincipal principal) {
        Long tenantId = principal.tenantId();

        BigDecimal totalRevenue = jdbcTemplate.queryForObject(
                "SELECT COALESCE(SUM(amount), 0) FROM orders WHERE tenant_id = ? AND payment_status = 'PAID'",
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

        Long totalCampaigns = jdbcTemplate.queryForObject(
                "SELECT COUNT(1) FROM campaigns WHERE tenant_id = ? AND status = 'ACTIVE'",
                Long.class, tenantId);

        Long totalProducts = jdbcTemplate.queryForObject(
                "SELECT COUNT(1) FROM products WHERE tenant_id = ? AND status = 'ACTIVE'",
                Long.class, tenantId);

        Long totalWorkflows = jdbcTemplate.queryForObject(
                "SELECT COUNT(1) FROM automation_workflows WHERE tenant_id = ? AND status = 'ACTIVE'",
                Long.class, tenantId);

        Long activeAgents = jdbcTemplate.queryForObject(
                "SELECT COUNT(1) FROM agent_monitors WHERE tenant_id = ? AND status = 'RUNNING'",
                Long.class, tenantId);

        // Fetch recent orders
        List<RecentOrder> recentOrders = jdbcTemplate.query(
                "SELECT o.id, o.amount, o.payment_status, o.status, p.name AS product_name, o.deployment_url "
                        + "FROM orders o JOIN products p ON p.tenant_id = o.tenant_id AND p.id = o.product_id "
                        + "WHERE o.tenant_id = ? ORDER BY o.id DESC LIMIT 10",
                (rs, row) -> new RecentOrder(
                        rs.getLong("id"),
                        rs.getBigDecimal("amount"),
                        rs.getString("payment_status"),
                        rs.getString("status"),
                        rs.getString("product_name"),
                        rs.getString("deployment_url")),
                tenantId);

        // Fetch active deployments
        List<ActiveDeployment> deployments = jdbcTemplate.query(
                "SELECT d.id, d.subdomain, d.container_id, d.status, p.name AS product_name "
                        + "FROM deployments d JOIN orders o ON o.tenant_id = d.tenant_id AND o.id = d.order_id "
                        + "JOIN products p ON p.tenant_id = o.tenant_id AND p.id = o.product_id "
                        + "WHERE d.tenant_id = ? ORDER BY d.id DESC LIMIT 10",
                (rs, row) -> new ActiveDeployment(
                        rs.getLong("id"),
                        rs.getString("subdomain"),
                        rs.getString("container_id"),
                        rs.getString("status"),
                        rs.getString("product_name")),
                tenantId);

        return new AdminDashboardData(
                safe(totalRevenue), safe(totalOrders), safe(totalUsers), safe(activeDeployments),
                safe(totalCampaigns), safe(totalProducts), safe(totalWorkflows), safe(activeAgents),
                recentOrders, deployments);
    }

    private static BigDecimal safe(BigDecimal val) {
        return val == null ? BigDecimal.ZERO : val;
    }

    private static long safe(Long val) {
        return val == null ? 0L : val;
    }

    public record AdminDashboardData(
            BigDecimal totalRevenue,
            long totalOrders,
            long totalUsers,
            long activeDeployments,
            long totalCampaigns,
            long totalProducts,
            long totalWorkflows,
            long activeAgents,
            List<RecentOrder> recentOrders,
            List<ActiveDeployment> recentDeployments) {
    }

    public record RecentOrder(
            Long id,
            BigDecimal amount,
            String paymentStatus,
            String status,
            String productName,
            String deploymentUrl) {
    }

    public record ActiveDeployment(
            Long id,
            String subdomain,
            String containerId,
            String status,
            String productName) {
    }
}
