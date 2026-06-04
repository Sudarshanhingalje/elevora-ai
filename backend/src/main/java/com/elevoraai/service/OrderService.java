package com.elevoraai.service;

import java.math.BigDecimal;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.sql.Statement;
import java.time.Instant;
import java.util.Locale;
import java.util.Objects;
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.http.HttpStatus;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.support.GeneratedKeyHolder;
import org.springframework.jdbc.support.KeyHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;
import org.springframework.web.server.ResponseStatusException;

@Service
public class OrderService {

    private static final String INR = "INR";

    private final JdbcTemplate jdbcTemplate;
    private final ObjectProvider<DeploymentTrigger> deploymentTriggerProvider;

    public OrderService(JdbcTemplate jdbcTemplate, ObjectProvider<DeploymentTrigger> deploymentTriggerProvider) {
        this.jdbcTemplate = jdbcTemplate;
        this.deploymentTriggerProvider = deploymentTriggerProvider;
    }

    @Transactional
    public OrderRecord createOrder(CreateOrderCommand command) {
        validateCreateOrderCommand(command);
        assertUserBelongsToTenant(command.tenantId(), command.userId());
        assertProductBelongsToTenant(command.tenantId(), command.productId());

        KeyHolder keyHolder = new GeneratedKeyHolder();
        jdbcTemplate.update(connection -> {
            PreparedStatement ps = connection.prepareStatement(
                    "INSERT INTO orders (tenant_id, user_id, product_id, amount, currency, payment_status, razorpay_order_id, status) "
                            + "VALUES (?, ?, ?, ?, ?, 'PENDING', ?, 'PENDING')",
                    Statement.RETURN_GENERATED_KEYS);
            ps.setLong(1, command.tenantId());
            ps.setLong(2, command.userId());
            ps.setLong(3, command.productId());
            ps.setBigDecimal(4, command.amount());
            ps.setString(5, normalizeCurrency(command.currency()));
            ps.setString(6, command.razorpayOrderId());
            return ps;
        }, keyHolder);

        Number key = keyHolder.getKey();
        if (key == null) {
            throw new IllegalStateException("Failed to create order");
        }

        logActivity(command.tenantId(), command.userId(), "ORDER_CREATED", "orders", key.longValue(), command.ipAddress());
        return findById(command.tenantId(), key.longValue());
    }

    @Transactional
    public OrderRecord updateStatusFromRazorpayWebhook(RazorpayOrderStatusCommand command) {
        validateStatusCommand(command);
        PaymentStatus paymentStatus = PaymentStatus.from(command.paymentStatus());
        String deploymentStatus = switch (paymentStatus) {
            case PENDING -> "PENDING";
            case PAID -> "DEPLOYING";
            case FAILED -> "FAILED";
            case REFUNDED -> "CANCELLED";
        };

        int updatedRows = jdbcTemplate.update(
                "UPDATE orders SET payment_status = ?, razorpay_payment_id = ?, status = ?, updated_at = CURRENT_TIMESTAMP "
                        + "WHERE tenant_id = ? AND razorpay_order_id = ?",
                paymentStatus.name(),
                command.razorpayPaymentId(),
                deploymentStatus,
                command.tenantId(),
                command.razorpayOrderId());

        if (updatedRows != 1) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Order not found for tenant");
        }

        OrderRecord order = findByRazorpayOrderId(command.tenantId(), command.razorpayOrderId());
        logActivity(
                command.tenantId(),
                order.userId(),
                "ORDER_PAYMENT_" + paymentStatus.name(),
                "orders",
                order.id(),
                command.ipAddress());

        if (paymentStatus == PaymentStatus.PAID) {
            DeploymentTrigger deploymentTrigger = deploymentTriggerProvider.getIfAvailable();
            if (deploymentTrigger == null) {
                throw new IllegalStateException("DeploymentService trigger is required for paid orders");
            }
            deploymentTrigger.deployPaidOrder(order);
        }

        return order;
    }

    @Transactional(readOnly = true)
    public OrderRecord findById(Long tenantId, Long orderId) {
        try {
            return jdbcTemplate.queryForObject(
                    "SELECT id, tenant_id, user_id, product_id, amount, currency, payment_status, razorpay_order_id, "
                            + "razorpay_payment_id, deployment_url, status, created_at, updated_at "
                            + "FROM orders WHERE tenant_id = ? AND id = ?",
                    this::mapOrder,
                    tenantId,
                    orderId);
        } catch (org.springframework.dao.EmptyResultDataAccessException ex) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Order not found for tenant");
        }
    }

    @Transactional(readOnly = true)
    public OrderRecord findByRazorpayOrderId(Long tenantId, String razorpayOrderId) {
        try {
            return jdbcTemplate.queryForObject(
                    "SELECT id, tenant_id, user_id, product_id, amount, currency, payment_status, razorpay_order_id, "
                            + "razorpay_payment_id, deployment_url, status, created_at, updated_at "
                            + "FROM orders WHERE tenant_id = ? AND razorpay_order_id = ?",
                    this::mapOrder,
                    tenantId,
                    razorpayOrderId);
        } catch (org.springframework.dao.EmptyResultDataAccessException ex) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Order not found for tenant");
        }
    }

    private void assertUserBelongsToTenant(Long tenantId, Long userId) {
        Integer count = jdbcTemplate.queryForObject(
                "SELECT COUNT(1) FROM users WHERE tenant_id = ? AND id = ?",
                Integer.class,
                tenantId,
                userId);
        if (count == null || count != 1) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "User does not belong to tenant");
        }
    }

    private void assertProductBelongsToTenant(Long tenantId, Long productId) {
        Integer count = jdbcTemplate.queryForObject(
                "SELECT COUNT(1) FROM products WHERE tenant_id = ? AND id = ? AND status = 'ACTIVE'",
                Integer.class,
                tenantId,
                productId);
        if (count == null || count != 1) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Active product does not belong to tenant");
        }
    }

    private void logActivity(Long tenantId, Long userId, String action, String entityType, Long entityId, String ipAddress) {
        jdbcTemplate.update(
                "INSERT INTO activity_logs (tenant_id, user_id, action, entity_type, entity_id, ip_address) "
                        + "VALUES (?, ?, ?, ?, ?, ?)",
                tenantId,
                userId,
                action,
                entityType,
                entityId,
                sanitizeIp(ipAddress));
    }

    private OrderRecord mapOrder(ResultSet rs, int rowNum) throws SQLException {
        return new OrderRecord(
                rs.getLong("id"),
                rs.getLong("tenant_id"),
                rs.getLong("user_id"),
                rs.getLong("product_id"),
                rs.getBigDecimal("amount"),
                rs.getString("currency"),
                rs.getString("payment_status"),
                rs.getString("razorpay_order_id"),
                rs.getString("razorpay_payment_id"),
                rs.getString("deployment_url"),
                rs.getString("status"),
                rs.getTimestamp("created_at").toInstant(),
                rs.getTimestamp("updated_at").toInstant());
    }

    private void validateCreateOrderCommand(CreateOrderCommand command) {
        Objects.requireNonNull(command, "Create order command is required");
        requirePositive(command.tenantId(), "Tenant id is required");
        requirePositive(command.userId(), "User id is required");
        requirePositive(command.productId(), "Product id is required");
        if (command.amount() == null || command.amount().signum() < 0) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Order amount must be non-negative");
        }
        if (!StringUtils.hasText(command.razorpayOrderId())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Razorpay order id is required");
        }
    }

    private void validateStatusCommand(RazorpayOrderStatusCommand command) {
        Objects.requireNonNull(command, "Razorpay status command is required");
        requirePositive(command.tenantId(), "Tenant id is required");
        if (!StringUtils.hasText(command.razorpayOrderId())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Razorpay order id is required");
        }
        PaymentStatus.from(command.paymentStatus());
        if (PaymentStatus.PAID.name().equalsIgnoreCase(command.paymentStatus()) && !StringUtils.hasText(command.razorpayPaymentId())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Razorpay payment id is required for paid orders");
        }
    }

    private void requirePositive(Long value, String message) {
        if (value == null || value <= 0) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, message);
        }
    }

    private String normalizeCurrency(String currency) {
        if (!StringUtils.hasText(currency)) {
            return INR;
        }
        String normalized = currency.trim().toUpperCase(Locale.ROOT);
        if (!normalized.matches("^[A-Z]{3}$")) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Currency must be a 3-letter ISO code");
        }
        return normalized;
    }

    private String sanitizeIp(String ipAddress) {
        if (!StringUtils.hasText(ipAddress)) {
            return "0.0.0.0";
        }
        return ipAddress.length() <= 45 ? ipAddress : ipAddress.substring(0, 45);
    }

    public interface DeploymentTrigger {
        void deployPaidOrder(OrderRecord order);
    }

    public enum PaymentStatus {
        PENDING,
        PAID,
        FAILED,
        REFUNDED;

        static PaymentStatus from(String status) {
            if (!StringUtils.hasText(status)) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Payment status is required");
            }
            try {
                return PaymentStatus.valueOf(status.trim().toUpperCase(Locale.ROOT));
            } catch (IllegalArgumentException ex) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Unsupported payment status", ex);
            }
        }
    }

    public record CreateOrderCommand(
            Long tenantId,
            Long userId,
            Long productId,
            BigDecimal amount,
            String currency,
            String razorpayOrderId,
            String ipAddress) {
    }

    public record RazorpayOrderStatusCommand(
            Long tenantId,
            String razorpayOrderId,
            String razorpayPaymentId,
            String paymentStatus,
            String ipAddress) {
    }

    public record OrderRecord(
            Long id,
            Long tenantId,
            Long userId,
            Long productId,
            BigDecimal amount,
            String currency,
            String paymentStatus,
            String razorpayOrderId,
            String razorpayPaymentId,
            String deploymentUrl,
            String status,
            Instant createdAt,
            Instant updatedAt) {
    }
}
