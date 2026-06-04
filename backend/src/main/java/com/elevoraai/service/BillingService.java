package com.elevoraai.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.math.BigDecimal;
import java.nio.charset.StandardCharsets;
import java.security.InvalidKeyException;
import java.security.NoSuchAlgorithmException;
import java.util.HexFormat;
import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;
import org.springframework.web.server.ResponseStatusException;

@Service
public class BillingService {

    private final JdbcTemplate jdbcTemplate;
    private final ObjectMapper objectMapper;
    private final InvoiceService invoiceService;
    private final NotificationService notificationService;
    private final String webhookSecret;

    public BillingService(
            JdbcTemplate jdbcTemplate,
            ObjectMapper objectMapper,
            InvoiceService invoiceService,
            NotificationService notificationService,
            @Value("${app.razorpay.webhook-secret:}") String webhookSecret) {
        this.jdbcTemplate = jdbcTemplate;
        this.objectMapper = objectMapper;
        this.invoiceService = invoiceService;
        this.notificationService = notificationService;
        this.webhookSecret = webhookSecret;
    }

    @Transactional
    public void handleRazorpayWebhook(String payload, String signature, String ipAddress) {
        verifySignature(payload, signature);
        try {
            JsonNode root = objectMapper.readTree(payload);
            String event = root.path("event").asText("unknown");
            JsonNode payment = root.path("payload").path("payment").path("entity");
            JsonNode order = root.path("payload").path("order").path("entity");
            String providerEventId = root.path("id").asText(null);
            String providerPaymentId = payment.path("id").asText(null);
            String providerOrderId = firstText(payment.path("order_id"), order.path("id"));
            String status = payment.path("status").asText(root.path("event").asText("received"));
            BigDecimal amount = payment.has("amount") ? BigDecimal.valueOf(payment.path("amount").asLong()).movePointLeft(2) : null;

            Long tenantId = findTenantId(providerOrderId);
            Long userId = findUserId(tenantId, providerOrderId);
            jdbcTemplate.update(
                    "INSERT IGNORE INTO billing_events (tenant_id, user_id, event_type, provider_event_id, provider_payment_id, "
                            + "provider_order_id, amount, currency, status, payload_json) VALUES (?, ?, ?, ?, ?, ?, ?, 'INR', ?, CAST(? AS JSON))",
                    tenantId,
                    userId,
                    event,
                    providerEventId,
                    providerPaymentId,
                    providerOrderId,
                    amount,
                    status,
                    payload);

            if ("payment.captured".equals(event) && providerOrderId != null) {
                jdbcTemplate.update(
                        "UPDATE orders SET payment_status = 'PAID', razorpay_payment_id = ?, status = 'DEPLOYING', updated_at = CURRENT_TIMESTAMP "
                                + "WHERE tenant_id = ? AND razorpay_order_id = ?",
                        providerPaymentId,
                        tenantId,
                        providerOrderId);
                invoiceService.issuePaidOrderInvoice(tenantId, providerOrderId);
                notificationService.notifyUser(tenantId, userId, "Payment successful", "Your Elevora AI payment was captured and deployment is queued.");
            }
        } catch (Exception ex) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid webhook payload", ex);
        }
    }

    private void verifySignature(String payload, String signature) {
        if (!StringUtils.hasText(webhookSecret)) {
            return;
        }
        if (!StringUtils.hasText(signature)) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Missing webhook signature");
        }
        try {
            Mac mac = Mac.getInstance("HmacSHA256");
            mac.init(new SecretKeySpec(webhookSecret.getBytes(StandardCharsets.UTF_8), "HmacSHA256"));
            String expected = HexFormat.of().formatHex(mac.doFinal(payload.getBytes(StandardCharsets.UTF_8)));
            if (!constantTimeEquals(expected, signature)) {
                throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Invalid webhook signature");
            }
        } catch (NoSuchAlgorithmException | InvalidKeyException ex) {
            throw new IllegalStateException("Unable to verify webhook signature", ex);
        }
    }

    private Long findTenantId(String razorpayOrderId) {
        Long tenantId = jdbcTemplate.queryForObject(
                "SELECT tenant_id FROM orders WHERE razorpay_order_id = ?",
                Long.class,
                razorpayOrderId);
        return tenantId == null ? 1L : tenantId;
    }

    private Long findUserId(Long tenantId, String razorpayOrderId) {
        return jdbcTemplate.queryForObject(
                "SELECT user_id FROM orders WHERE tenant_id = ? AND razorpay_order_id = ?",
                Long.class,
                tenantId,
                razorpayOrderId);
    }

    private String firstText(JsonNode first, JsonNode second) {
        if (first != null && first.isTextual() && StringUtils.hasText(first.asText())) return first.asText();
        if (second != null && second.isTextual() && StringUtils.hasText(second.asText())) return second.asText();
        return null;
    }

    private boolean constantTimeEquals(String expected, String actual) {
        byte[] a = expected.getBytes(StandardCharsets.UTF_8);
        byte[] b = actual.getBytes(StandardCharsets.UTF_8);
        if (a.length != b.length) return false;
        int result = 0;
        for (int i = 0; i < a.length; i++) result |= a[i] ^ b[i];
        return result == 0;
    }
}
