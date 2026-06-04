package com.elevoraai.service;

import com.elevoraai.service.ProductService.ProductResponse;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.nio.charset.StandardCharsets;
import java.security.InvalidKeyException;
import java.security.NoSuchAlgorithmException;
import java.sql.PreparedStatement;
import java.sql.Statement;
import java.time.Instant;
import java.util.Base64;
import java.util.HexFormat;
import java.util.Map;
import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.support.GeneratedKeyHolder;
import org.springframework.jdbc.support.KeyHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;
import org.springframework.web.client.RestClient;
import org.springframework.web.server.ResponseStatusException;

@Service
public class PaymentService {

    private static final String INR = "INR";

    private final JdbcTemplate jdbcTemplate;
    private final ProductService productService;
    private final RestClient razorpayClient;
    private final String razorpayKeyId;
    private final String razorpaySecret;

    public PaymentService(
            JdbcTemplate jdbcTemplate,
            ProductService productService,
            RestClient.Builder restClientBuilder,
            @Value("${app.razorpay.key-id}") String razorpayKeyId,
            @Value("${app.razorpay.secret}") String razorpaySecret) {
        if (!StringUtils.hasText(razorpayKeyId) || !StringUtils.hasText(razorpaySecret)) {
            throw new IllegalStateException("Razorpay key id and secret are required");
        }
        this.jdbcTemplate = jdbcTemplate;
        this.productService = productService;
        this.razorpayKeyId = razorpayKeyId;
        this.razorpaySecret = razorpaySecret;
        this.razorpayClient = restClientBuilder
                .baseUrl("https://api.razorpay.com/v1")
                .defaultHeader(HttpHeaders.AUTHORIZATION, basicAuthHeader(razorpayKeyId, razorpaySecret))
                .build();
    }

    @Transactional
    public CheckoutOrderResponse createCheckoutOrder(Long tenantId, Long userId, Long productId) {
        ProductResponse product = productService.getActiveProductById(tenantId, productId);
        int amountInPaise = product.price().multiply(BigDecimal.valueOf(100)).setScale(0, RoundingMode.HALF_UP).intValueExact();
        String receipt = "tenant-" + tenantId + "-user-" + userId + "-product-" + product.id() + "-" + Instant.now().toEpochMilli();

        @SuppressWarnings("unchecked")
        Map<String, Object> razorpayOrder = razorpayClient.post()
                .uri("/orders")
                .body(Map.of(
                        "amount", amountInPaise,
                        "currency", INR,
                        "receipt", receipt,
                        "payment_capture", 1))
                .retrieve()
                .body(Map.class);

        if (razorpayOrder == null || !StringUtils.hasText((String) razorpayOrder.get("id"))) {
            throw new ResponseStatusException(HttpStatus.BAD_GATEWAY, "Unable to create payment order");
        }

        String razorpayOrderId = (String) razorpayOrder.get("id");
        KeyHolder keyHolder = new GeneratedKeyHolder();
        jdbcTemplate.update(connection -> {
            PreparedStatement ps = connection.prepareStatement(
                    "INSERT INTO orders (tenant_id, user_id, product_id, amount, currency, payment_status, razorpay_order_id, status) "
                            + "VALUES (?, ?, ?, ?, ?, 'PENDING', ?, 'PENDING')",
                    Statement.RETURN_GENERATED_KEYS);
            ps.setLong(1, tenantId);
            ps.setLong(2, userId);
            ps.setLong(3, product.id());
            ps.setBigDecimal(4, product.price());
            ps.setString(5, INR);
            ps.setString(6, razorpayOrderId);
            return ps;
        }, keyHolder);

        Number orderId = keyHolder.getKey();
        if (orderId == null) {
            throw new IllegalStateException("Failed to create local order");
        }

        return new CheckoutOrderResponse(
                orderId.longValue(),
                tenantId,
                product.id(),
                product.name(),
                product.price(),
                INR,
                razorpayOrderId,
                razorpayKeyId,
                amountInPaise);
    }

    @Transactional
    public PaymentVerificationResponse verifyPayment(
            Long tenantId,
            Long userId,
            String razorpayOrderId,
            String razorpayPaymentId,
            String razorpaySignature) {
        if (!isValidSignature(razorpayOrderId, razorpayPaymentId, razorpaySignature)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid payment signature");
        }

        int updatedRows = jdbcTemplate.update(
                "UPDATE orders SET payment_status = 'PAID', razorpay_payment_id = ?, status = 'DEPLOYING', updated_at = CURRENT_TIMESTAMP "
                        + "WHERE tenant_id = ? AND user_id = ? AND razorpay_order_id = ? AND payment_status = 'PENDING'",
                razorpayPaymentId,
                tenantId,
                userId,
                razorpayOrderId);

        if (updatedRows != 1) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Pending order not found");
        }

        return new PaymentVerificationResponse(razorpayOrderId, razorpayPaymentId, "PAID");
    }

    private boolean isValidSignature(String orderId, String paymentId, String signature) {
        try {
            Mac mac = Mac.getInstance("HmacSHA256");
            mac.init(new SecretKeySpec(razorpaySecret.getBytes(StandardCharsets.UTF_8), "HmacSHA256"));
            byte[] digest = mac.doFinal((orderId + "|" + paymentId).getBytes(StandardCharsets.UTF_8));
            String expectedSignature = HexFormat.of().formatHex(digest);
            return MessageDigestSafeEquals.equals(expectedSignature, signature);
        } catch (NoSuchAlgorithmException | InvalidKeyException ex) {
            throw new IllegalStateException("Unable to verify payment signature", ex);
        }
    }

    private String basicAuthHeader(String keyId, String secret) {
        String credentials = keyId + ":" + secret;
        return "Basic " + Base64.getEncoder().encodeToString(credentials.getBytes(StandardCharsets.UTF_8));
    }

    public record CheckoutOrderResponse(
            Long orderId,
            Long tenantId,
            Long productId,
            String productName,
            BigDecimal amount,
            String currency,
            String razorpayOrderId,
            String razorpayKeyId,
            int amountInPaise) {
    }

    public record PaymentVerificationResponse(
            String razorpayOrderId,
            String razorpayPaymentId,
            String paymentStatus) {
    }

    private static final class MessageDigestSafeEquals {
        private MessageDigestSafeEquals() {
        }

        static boolean equals(String expected, String actual) {
            if (!StringUtils.hasText(expected) || !StringUtils.hasText(actual)) {
                return false;
            }
            byte[] expectedBytes = expected.getBytes(StandardCharsets.UTF_8);
            byte[] actualBytes = actual.getBytes(StandardCharsets.UTF_8);
            if (expectedBytes.length != actualBytes.length) {
                return false;
            }
            int result = 0;
            for (int i = 0; i < expectedBytes.length; i++) {
                result |= expectedBytes[i] ^ actualBytes[i];
            }
            return result == 0;
        }
    }
}
