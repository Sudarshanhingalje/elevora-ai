package com.elevoraai.service;

import com.elevoraai.service.OrderService.DeploymentTrigger;
import com.elevoraai.service.OrderService.OrderRecord;
import java.io.BufferedReader;
import java.io.IOException;
import java.io.InputStreamReader;
import java.nio.charset.StandardCharsets;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.sql.Statement;
import java.time.Duration;
import java.time.Instant;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Optional;
import java.util.concurrent.TimeUnit;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.support.GeneratedKeyHolder;
import org.springframework.jdbc.support.KeyHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;
import org.springframework.web.server.ResponseStatusException;

@Service
public class DeploymentService implements DeploymentTrigger {

    private static final Duration DEPLOY_TIMEOUT = Duration.ofMinutes(5);
    private static final String AUDIT_IP = "127.0.0.1";

    private final JdbcTemplate jdbcTemplate;
    private final NotificationService notificationService;
    private final String deployScriptPath;
    private final String dbHost;
    private final String dbName;
    private final String dbUsername;
    private final String dbPassword;
    private final String redisHost;
    private final String redisPassword;
    private final String publicDomain;

    public DeploymentService(
            JdbcTemplate jdbcTemplate,
            NotificationService notificationService,
            @Value("${app.deploy.script-path:../deploy.sh}") String deployScriptPath,
            @Value("${DB_HOST}") String dbHost,
            @Value("${DB_NAME}") String dbName,
            @Value("${DB_USERNAME}") String dbUsername,
            @Value("${DB_PASSWORD}") String dbPassword,
            @Value("${REDIS_HOST}") String redisHost,
            @Value("${REDIS_PASSWORD}") String redisPassword,
            @Value("${PUBLIC_DOMAIN:elevora.ai}") String publicDomain) {
        this.jdbcTemplate = jdbcTemplate;
        this.notificationService = notificationService;
        this.deployScriptPath = deployScriptPath;
        this.dbHost = dbHost;
        this.dbName = dbName;
        this.dbUsername = dbUsername;
        this.dbPassword = dbPassword;
        this.redisHost = redisHost;
        this.redisPassword = redisPassword;
        this.publicDomain = publicDomain;
    }

    @Override
    @Transactional
    public void deployPaidOrder(OrderRecord order) {
        if (!"PAID".equals(order.paymentStatus())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Only paid orders can be deployed");
        }

        DeploymentPlan plan = loadDeploymentPlan(order.tenantId(), order.id());
        Long deploymentId = upsertQueuedDeployment(order, plan);
        logActivity(order.tenantId(), order.userId(), "DEPLOYMENT_QUEUED", "deployments", deploymentId);

        DeploymentResult result = runDeployScript(plan.tenantSlug(), plan.dockerImage(), plan.containerName());
        if (result.success()) {
            markDeploymentRunning(order, deploymentId, result.containerId(), plan.subdomain());
            logActivity(order.tenantId(), order.userId(), "DEPLOYMENT_RUNNING", "deployments", deploymentId);
            
            // Send In-App & Email Notification to client
            String title = "Your AI Product is Live!";
            String body = "Your purchased AI product has been successfully activated and deployed. You can access it here: https://" + plan.subdomain();
            notificationService.notifyUser(order.tenantId(), order.userId(), title, body);
            
            return;
        }

        markDeploymentFailed(order.tenantId(), order.id(), deploymentId);
        logActivity(order.tenantId(), order.userId(), "DEPLOYMENT_FAILED", "deployments", deploymentId);
        throw new ResponseStatusException(HttpStatus.BAD_GATEWAY, "Docker deployment failed");
    }

    @Transactional(readOnly = true)
    public Optional<DeploymentRecord> findByOrder(Long tenantId, Long orderId) {
        try {
            return Optional.ofNullable(jdbcTemplate.queryForObject(
                    "SELECT id, order_id, tenant_id, subdomain, container_id, status, deployed_at, updated_at "
                            + "FROM deployments WHERE tenant_id = ? AND order_id = ?",
                    this::mapDeployment,
                    tenantId,
                    orderId));
        } catch (org.springframework.dao.EmptyResultDataAccessException ex) {
            return Optional.empty();
        }
    }

    public List<DeploymentRecord> listDeployments(Long tenantId) {
        return jdbcTemplate.query(
                "SELECT id, order_id, tenant_id, subdomain, container_id, status, deployed_at, updated_at "
                        + "FROM deployments WHERE tenant_id = ? ORDER BY id DESC",
                this::mapDeployment,
                tenantId);
    }

    public DeploymentRecord getDeployment(Long tenantId, Long id) {
        try {
            return jdbcTemplate.queryForObject(
                    "SELECT id, order_id, tenant_id, subdomain, container_id, status, deployed_at, updated_at "
                            + "FROM deployments WHERE tenant_id = ? AND id = ?",
                    this::mapDeployment,
                    tenantId,
                    id);
        } catch (org.springframework.dao.EmptyResultDataAccessException ex) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Deployment not found");
        }
    }

    @Transactional
    public void updateStatus(Long tenantId, Long id, String status) {
        String normalizedStatus = status.trim().toUpperCase(Locale.ROOT);
        if (!List.of("PENDING", "BUILDING", "DEPLOYING", "RUNNING", "FAILED", "STOPPED", "COMPLETED").contains(normalizedStatus)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid status");
        }
        int updated = jdbcTemplate.update(
                "UPDATE deployments SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE tenant_id = ? AND id = ?",
                normalizedStatus,
                tenantId,
                id);
        if (updated != 1) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Deployment not found");
        }
    }

    private DeploymentPlan loadDeploymentPlan(Long tenantId, Long orderId) {
        try {
            return jdbcTemplate.queryForObject(
                    "SELECT t.slug AS tenant_slug, p.docker_image AS docker_image "
                            + "FROM orders o "
                            + "JOIN tenants t ON t.id = o.tenant_id AND t.tenant_id = t.id "
                            + "JOIN products p ON p.tenant_id = o.tenant_id AND p.id = o.product_id "
                            + "WHERE o.tenant_id = ? AND o.id = ? AND o.payment_status = 'PAID'",
                    (rs, rowNum) -> {
                        String tenantSlug = rs.getString("tenant_slug");
                        String dockerImage = rs.getString("docker_image");
                        if (!StringUtils.hasText(dockerImage)) {
                            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Product Docker image is required");
                        }
                        String normalizedSlug = normalizeSlug(tenantSlug);
                        String subdomain = normalizedSlug + "." + publicDomain;
                        String containerName = "elevora-" + normalizedSlug;
                        return new DeploymentPlan(normalizedSlug, dockerImage, subdomain, containerName);
                    },
                    tenantId,
                    orderId);
        } catch (org.springframework.dao.EmptyResultDataAccessException ex) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Paid order not found for tenant");
        }
    }

    private Long upsertQueuedDeployment(OrderRecord order, DeploymentPlan plan) {
        Optional<DeploymentRecord> existing = findByOrder(order.tenantId(), order.id());
        if (existing.isPresent()) {
            jdbcTemplate.update(
                    "UPDATE deployments SET subdomain = ?, container_id = NULL, status = 'QUEUED', deployed_at = NULL, updated_at = CURRENT_TIMESTAMP "
                            + "WHERE tenant_id = ? AND order_id = ?",
                    plan.subdomain(),
                    order.tenantId(),
                    order.id());
            return existing.get().id();
        }

        KeyHolder keyHolder = new GeneratedKeyHolder();
        jdbcTemplate.update(connection -> {
            PreparedStatement ps = connection.prepareStatement(
                    "INSERT INTO deployments (order_id, tenant_id, subdomain, container_id, status, deployed_at) "
                            + "VALUES (?, ?, ?, NULL, 'QUEUED', NULL)",
                    Statement.RETURN_GENERATED_KEYS);
            ps.setLong(1, order.id());
            ps.setLong(2, order.tenantId());
            ps.setString(3, plan.subdomain());
            return ps;
        }, keyHolder);

        Number key = keyHolder.getKey();
        if (key == null) {
            throw new IllegalStateException("Failed to queue deployment");
        }
        return key.longValue();
    }

    private DeploymentResult runDeployScript(String tenantSlug, String dockerImage, String containerName) {
        ProcessBuilder processBuilder = new ProcessBuilder(deployScriptPath, tenantSlug, dockerImage, containerName);
        Map<String, String> env = processBuilder.environment();
        env.put("DB_HOST", dbHost);
        env.put("DB_NAME", dbName);
        env.put("DB_USERNAME", dbUsername);
        env.put("DB_PASSWORD", dbPassword);
        env.put("REDIS_HOST", redisHost);
        env.put("REDIS_PASSWORD", redisPassword);

        try {
            Process process = processBuilder.start();
            boolean finished = process.waitFor(DEPLOY_TIMEOUT.toSeconds(), TimeUnit.SECONDS);
            if (!finished) {
                process.destroyForcibly();
                return new DeploymentResult(false, null);
            }

            String output = readProcessOutput(process);
            if (process.exitValue() != 0 || !StringUtils.hasText(output)) {
                return new DeploymentResult(false, null);
            }

            return new DeploymentResult(true, output.lines().reduce((first, second) -> second).orElse(output).trim());
        } catch (IOException ex) {
            throw new ResponseStatusException(HttpStatus.BAD_GATEWAY, "Deployment script could not be started", ex);
        } catch (InterruptedException ex) {
            Thread.currentThread().interrupt();
            throw new ResponseStatusException(HttpStatus.SERVICE_UNAVAILABLE, "Deployment was interrupted", ex);
        }
    }

    private String readProcessOutput(Process process) throws IOException {
        StringBuilder output = new StringBuilder();
        try (BufferedReader reader = new BufferedReader(new InputStreamReader(process.getInputStream(), StandardCharsets.UTF_8));
                BufferedReader errorReader = new BufferedReader(new InputStreamReader(process.getErrorStream(), StandardCharsets.UTF_8))) {
            reader.lines().forEach(line -> output.append(line).append(System.lineSeparator()));
            errorReader.lines().forEach(line -> output.append(line).append(System.lineSeparator()));
        }
        return output.toString().trim();
    }

    private void markDeploymentRunning(OrderRecord order, Long deploymentId, String containerId, String subdomain) {
        int deploymentRows = jdbcTemplate.update(
                "UPDATE deployments SET container_id = ?, status = 'RUNNING', deployed_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP "
                        + "WHERE tenant_id = ? AND id = ? AND order_id = ?",
                containerId,
                order.tenantId(),
                deploymentId,
                order.id());

        int orderRows = jdbcTemplate.update(
                "UPDATE orders SET deployment_url = ?, status = 'DEPLOYED', updated_at = CURRENT_TIMESTAMP "
                        + "WHERE tenant_id = ? AND id = ?",
                "https://" + subdomain,
                order.tenantId(),
                order.id());

        if (deploymentRows != 1 || orderRows != 1) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Deployment state could not be saved");
        }
    }

    private void markDeploymentFailed(Long tenantId, Long orderId, Long deploymentId) {
        jdbcTemplate.update(
                "UPDATE deployments SET status = 'FAILED', updated_at = CURRENT_TIMESTAMP "
                        + "WHERE tenant_id = ? AND id = ? AND order_id = ?",
                tenantId,
                deploymentId,
                orderId);

        jdbcTemplate.update(
                "UPDATE orders SET status = 'FAILED', updated_at = CURRENT_TIMESTAMP "
                        + "WHERE tenant_id = ? AND id = ?",
                tenantId,
                orderId);
    }

    private void logActivity(Long tenantId, Long userId, String action, String entityType, Long entityId) {
        jdbcTemplate.update(
                "INSERT INTO activity_logs (tenant_id, user_id, action, entity_type, entity_id, ip_address) "
                        + "VALUES (?, ?, ?, ?, ?, ?)",
                tenantId,
                userId,
                action,
                entityType,
                entityId,
                AUDIT_IP);
    }

    private DeploymentRecord mapDeployment(ResultSet rs, int rowNum) throws SQLException {
        return new DeploymentRecord(
                rs.getLong("id"),
                rs.getLong("order_id"),
                rs.getLong("tenant_id"),
                rs.getString("subdomain"),
                rs.getString("container_id"),
                rs.getString("status"),
                rs.getTimestamp("deployed_at") == null ? null : rs.getTimestamp("deployed_at").toInstant(),
                rs.getTimestamp("updated_at").toInstant());
    }

    private String normalizeSlug(String value) {
        String normalized = value == null ? "" : value.trim().toLowerCase(Locale.ROOT);
        if (!normalized.matches("^[a-z0-9][a-z0-9-]*[a-z0-9]$")) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Tenant slug is invalid");
        }
        return normalized;
    }

    private record DeploymentPlan(String tenantSlug, String dockerImage, String subdomain, String containerName) {
    }

    private record DeploymentResult(boolean success, String containerId) {
    }

    public record DeploymentRecord(
            Long id,
            Long orderId,
            Long tenantId,
            String subdomain,
            String containerId,
            String status,
            Instant deployedAt,
            Instant updatedAt) {
    }
}
