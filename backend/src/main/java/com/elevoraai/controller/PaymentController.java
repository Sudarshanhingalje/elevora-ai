package com.elevoraai.controller;

import com.elevoraai.config.SecurityConfig.JwtPrincipal;
import com.elevoraai.service.PaymentService;
import com.elevoraai.service.PaymentService.CheckoutOrderResponse;
import com.elevoraai.service.PaymentService.PaymentVerificationResponse;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Positive;
import org.springframework.security.core.Authentication;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@Validated
@RestController
@RequestMapping("/api/payments/razorpay")
public class PaymentController {

    private final PaymentService paymentService;

    public PaymentController(PaymentService paymentService) {
        this.paymentService = paymentService;
    }

    @PostMapping("/orders")
    public CheckoutOrderResponse createOrder(
            @Valid @RequestBody CreateCheckoutOrderRequest request,
            Authentication authentication) {
        JwtPrincipal principal = principal(authentication);
        return paymentService.createCheckoutOrder(principal.tenantId(), principal.userId(), request.productId());
    }

    @PostMapping("/verify")
    public PaymentVerificationResponse verifyPayment(
            @Valid @RequestBody VerifyPaymentRequest request,
            Authentication authentication) {
        JwtPrincipal principal = principal(authentication);
        return paymentService.verifyPayment(
                principal.tenantId(),
                principal.userId(),
                request.razorpayOrderId(),
                request.razorpayPaymentId(),
                request.razorpaySignature());
    }

    private JwtPrincipal principal(Authentication authentication) {
        if (authentication == null || !(authentication.getPrincipal() instanceof JwtPrincipal jwtPrincipal)) {
            throw new IllegalStateException("Authenticated JWT principal is required");
        }
        return jwtPrincipal;
    }

    public record CreateCheckoutOrderRequest(
            @NotNull
            @Positive
            Long productId) {
    }

    public record VerifyPaymentRequest(
            @NotBlank
            @Pattern(regexp = "^order_[A-Za-z0-9]+$")
            String razorpayOrderId,

            @NotBlank
            @Pattern(regexp = "^pay_[A-Za-z0-9]+$")
            String razorpayPaymentId,

            @NotBlank
            @Pattern(regexp = "^[a-fA-F0-9]{64}$")
            String razorpaySignature) {
    }
}
