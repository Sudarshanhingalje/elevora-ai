package com.elevoraai.controller;

import com.elevoraai.config.SecurityConfig.JwtPrincipal;
import com.elevoraai.service.SubscriptionBillingService;
import com.elevoraai.service.SubscriptionBillingService.CurrentSubscriptionResponse;
import com.elevoraai.service.SubscriptionBillingService.PlanResponse;
import com.elevoraai.service.SubscriptionBillingService.SubscribeRequest;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import java.util.List;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@Validated
@RestController
@RequestMapping("/api/subscriptions")
public class SubscriptionController {

    private final SubscriptionBillingService subscriptionBillingService;

    public SubscriptionController(SubscriptionBillingService subscriptionBillingService) {
        this.subscriptionBillingService = subscriptionBillingService;
    }

    @GetMapping("/plans")
    public List<PlanResponse> listPlans(@AuthenticationPrincipal JwtPrincipal principal) {
        return subscriptionBillingService.listPlans(principal);
    }

    @GetMapping("/current")
    public CurrentSubscriptionResponse current(@AuthenticationPrincipal JwtPrincipal principal) {
        return subscriptionBillingService.currentSubscription(principal);
    }

    @PostMapping
    public CurrentSubscriptionResponse subscribe(
            @AuthenticationPrincipal JwtPrincipal principal,
            @Valid @RequestBody SubscribeRequest request) {
        return subscriptionBillingService.createSubscription(principal, request);
    }

    @GetMapping("/can-use")
    public FeatureGateResponse canUse(
            @AuthenticationPrincipal JwtPrincipal principal,
            @RequestParam @NotBlank @Pattern(regexp = "^(GYM_AI|CRM_AI|SOCIAL_AGENT|CONTENT_AGENT|UNLIMITED_PRODUCTS)$") String feature) {
        return new FeatureGateResponse(feature, subscriptionBillingService.canUseFeature(principal, feature));
    }

    public record FeatureGateResponse(String feature, boolean allowed) {
    }
}
