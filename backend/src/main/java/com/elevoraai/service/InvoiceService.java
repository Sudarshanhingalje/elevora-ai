package com.elevoraai.service;

import java.math.BigDecimal;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.time.Instant;
import java.util.List;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class InvoiceService {

    private final JdbcTemplate jdbcTemplate;

    public InvoiceService(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    @Transactional
    public InvoiceResponse issuePaidOrderInvoice(Long tenantId, String razorpayOrderId) {
        OrderInvoiceSource source = jdbcTemplate.queryForObject(
                "SELECT id, tenant_id, user_id, amount, currency FROM orders WHERE tenant_id = ? AND razorpay_order_id = ?",
                this::mapSource,
                tenantId,
                razorpayOrderId);
        String invoiceNumber = "ELV-" + tenantId + "-" + source.orderId();
        jdbcTemplate.update(
                "INSERT INTO invoices (tenant_id, user_id, order_id, invoice_number, amount, currency, status, paid_at) "
                        + "VALUES (?, ?, ?, ?, ?, ?, 'PAID', CURRENT_TIMESTAMP) "
                        + "ON DUPLICATE KEY UPDATE status = 'PAID', paid_at = CURRENT_TIMESTAMP",
                source.tenantId(),
                source.userId(),
                source.orderId(),
                invoiceNumber,
                source.amount(),
                source.currency());
        return findByInvoiceNumber(tenantId, invoiceNumber);
    }

    public List<InvoiceResponse> listUserInvoices(Long tenantId, Long userId) {
        return jdbcTemplate.query(
                "SELECT id, tenant_id, user_id, order_id, subscription_id, invoice_number, amount, currency, status, issued_at, paid_at "
                        + "FROM invoices WHERE tenant_id = ? AND user_id = ? ORDER BY issued_at DESC, id DESC",
                this::mapInvoice,
                tenantId,
                userId);
    }

    public InvoiceResponse findByInvoiceNumber(Long tenantId, String invoiceNumber) {
        return jdbcTemplate.queryForObject(
                "SELECT id, tenant_id, user_id, order_id, subscription_id, invoice_number, amount, currency, status, issued_at, paid_at "
                        + "FROM invoices WHERE tenant_id = ? AND invoice_number = ?",
                this::mapInvoice,
                tenantId,
                invoiceNumber);
    }

    private OrderInvoiceSource mapSource(ResultSet rs, int rowNum) throws SQLException {
        return new OrderInvoiceSource(
                rs.getLong("id"),
                rs.getLong("tenant_id"),
                rs.getLong("user_id"),
                rs.getBigDecimal("amount"),
                rs.getString("currency"));
    }

    private InvoiceResponse mapInvoice(ResultSet rs, int rowNum) throws SQLException {
        return new InvoiceResponse(
                rs.getLong("id"),
                rs.getLong("tenant_id"),
                rs.getLong("user_id"),
                rs.getObject("order_id") == null ? null : rs.getLong("order_id"),
                rs.getObject("subscription_id") == null ? null : rs.getLong("subscription_id"),
                rs.getString("invoice_number"),
                rs.getBigDecimal("amount"),
                rs.getString("currency"),
                rs.getString("status"),
                rs.getTimestamp("issued_at").toInstant(),
                rs.getTimestamp("paid_at") == null ? null : rs.getTimestamp("paid_at").toInstant());
    }

    private record OrderInvoiceSource(Long orderId, Long tenantId, Long userId, BigDecimal amount, String currency) {
    }

    public record InvoiceResponse(Long id, Long tenantId, Long userId, Long orderId, Long subscriptionId, String invoiceNumber, BigDecimal amount, String currency, String status, Instant issuedAt, Instant paidAt) {
    }
}
