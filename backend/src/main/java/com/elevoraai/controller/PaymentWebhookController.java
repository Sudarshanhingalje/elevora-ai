package com.elevoraai.controller;

import com.elevoraai.service.BillingService;
import jakarta.servlet.http.HttpServletRequest;
import java.io.IOException;
import java.nio.charset.StandardCharsets;
import org.springframework.http.ResponseEntity;
import org.springframework.util.StreamUtils;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/webhooks/razorpay")
public class PaymentWebhookController {

    private final BillingService billingService;

    public PaymentWebhookController(BillingService billingService) {
        this.billingService = billingService;
    }

    @PostMapping
    public ResponseEntity<WebhookResponse> handleWebhook(
            HttpServletRequest request,
            @RequestHeader(name = "X-Razorpay-Signature", required = false) String signature) throws IOException {
        String payload = StreamUtils.copyToString(request.getInputStream(), StandardCharsets.UTF_8);
        billingService.handleRazorpayWebhook(payload, signature, clientIp(request));
        return ResponseEntity.ok(new WebhookResponse("accepted"));
    }

    private String clientIp(HttpServletRequest request) {
        String forwardedFor = request.getHeader("X-Forwarded-For");
        return forwardedFor == null || forwardedFor.isBlank() ? request.getRemoteAddr() : forwardedFor.split(",")[0].trim();
    }

    public record WebhookResponse(String status) {
    }
}
