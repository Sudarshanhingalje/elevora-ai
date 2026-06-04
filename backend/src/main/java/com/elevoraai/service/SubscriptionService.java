package com.elevoraai.service;

import com.elevoraai.config.SecurityConfig.JwtPrincipal;
import com.elevoraai.service.SubscriptionBillingService.CurrentSubscriptionResponse;
import com.elevoraai.service.SubscriptionBillingService.PlanResponse;
import com.elevoraai.service.SubscriptionBillingService.SubscribeRequest;
import java.util.List;
import org.springframework.stereotype.Service;

@Service
public class SubscriptionService {

    private final SubscriptionBillingService subscriptionBillingService;

    public SubscriptionService(SubscriptionBillingService subscriptionBillingService) {
        this.subscriptionBillingService = subscriptionBillingService;
    }

    public List<PlanResponse> plans(JwtPrincipal principal) {
        return subscriptionBillingService.listPlans(principal);
    }

    public CurrentSubscriptionResponse current(JwtPrincipal principal) {
        return subscriptionBillingService.currentSubscription(principal);
    }

    public CurrentSubscriptionResponse subscribe(JwtPrincipal principal, SubscribeRequest request) {
        return subscriptionBillingService.createSubscription(principal, request);
    }

    public boolean canUseFeature(JwtPrincipal principal, String featureCode) {
        return subscriptionBillingService.canUseFeature(principal, featureCode);
    }
}
