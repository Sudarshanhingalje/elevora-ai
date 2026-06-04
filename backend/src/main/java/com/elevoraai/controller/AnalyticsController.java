package com.elevoraai.controller;

import com.elevoraai.config.SecurityConfig.JwtPrincipal;
import com.elevoraai.service.AdminAnalyticsService;
import com.elevoraai.service.AdminAnalyticsService.*;
import com.elevoraai.service.RevenueService;
import com.elevoraai.service.RevenueService.*;
import com.elevoraai.service.UsageMetricsService;
import com.elevoraai.service.UsageMetricsService.*;
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

/**
 * REST controller exposing analytics endpoints.
 *
 * <ul>
 *   <li>USER role  → usage metrics scoped to own tenant/user
 *   <li>ADMIN role → full admin KPIs, revenue analytics, growth reports
 * </ul>
 *
 * All data is tenant-isolated – every query carries the JWT-derived tenantId.
 */
@RestController
@RequestMapping("/api/analytics")
public class AnalyticsController {

    private final RevenueService      revenueService;
    private final UsageMetricsService usageMetricsService;
    private final AdminAnalyticsService adminAnalyticsService;

    public AnalyticsController(RevenueService revenueService,
                               UsageMetricsService usageMetricsService,
                               AdminAnalyticsService adminAnalyticsService) {
        this.revenueService       = revenueService;
        this.usageMetricsService  = usageMetricsService;
        this.adminAnalyticsService = adminAnalyticsService;
    }

    // ─── Shared (USER + ADMIN) ────────────────────────────────────────────────

    /** Platform usage summary – active users, deployments, AI feature hits. */
    @GetMapping("/usage")
    public UsageSummary usageSummary(@AuthenticationPrincipal JwtPrincipal p) {
        return new UsageSummary(
                usageMetricsService.totalUsers(p.tenantId()),
                usageMetricsService.activeUsers(p.tenantId()),
                usageMetricsService.runningDeployments(p.tenantId()),
                usageMetricsService.openTickets(p.tenantId()),
                usageMetricsService.aiFeatureUsage(p.tenantId()),
                usageMetricsService.dailyActivity(p.tenantId()));
    }

    // ─── ADMIN only ────────────────────────────────────────────────────────────

    /** Admin KPI summary: revenue, orders, subscriptions, open tickets. */
    @GetMapping("/kpi")
    public AdminKpiSummary kpiSummary(@AuthenticationPrincipal JwtPrincipal p) {
        requireAdmin(p);
        return adminAnalyticsService.kpiSummary(p.tenantId());
    }

    /** Monthly revenue + order counts for the last {@code months} months (default 12). */
    @GetMapping("/revenue/monthly")
    public List<MonthlyRevenue> monthlyRevenue(
            @AuthenticationPrincipal JwtPrincipal p,
            @RequestParam(defaultValue = "12") int months) {
        requireAdmin(p);
        return revenueService.monthlyRevenue(p.tenantId(), Math.min(months, 36));
    }

    /** Top N revenue-generating products (default 10). */
    @GetMapping("/revenue/products")
    public List<ProductRevenue> topProducts(
            @AuthenticationPrincipal JwtPrincipal p,
            @RequestParam(defaultValue = "10") int limit) {
        requireAdmin(p);
        return revenueService.topProducts(p.tenantId(), Math.min(limit, 50));
    }

    /** Revenue summary: total, average order value, order count. */
    @GetMapping("/revenue/summary")
    public RevenueSummary revenueSummary(@AuthenticationPrincipal JwtPrincipal p) {
        requireAdmin(p);
        return revenueService.summary(p.tenantId());
    }

    /** Monthly growth data (default 12 months). */
    @GetMapping("/growth/monthly")
    public List<MonthlyGrowth> monthlyGrowth(
            @AuthenticationPrincipal JwtPrincipal p,
            @RequestParam(defaultValue = "12") int months) {
        requireAdmin(p);
        return adminAnalyticsService.monthlyGrowth(p.tenantId(), Math.min(months, 24));
    }

    /** Daily signup trend (default 30 days). */
    @GetMapping("/growth/signups")
    public List<DailySignup> signupTrend(
            @AuthenticationPrincipal JwtPrincipal p,
            @RequestParam(defaultValue = "30") int days) {
        requireAdmin(p);
        return adminAnalyticsService.signupTrend(p.tenantId(), Math.min(days, 90));
    }

    /** Subscription plan distribution. */
    @GetMapping("/subscriptions/plans")
    public List<PlanBreakdown> subscriptionPlans(@AuthenticationPrincipal JwtPrincipal p) {
        requireAdmin(p);
        return adminAnalyticsService.subscriptionPlans(p.tenantId());
    }

    /** Top N customers by lifetime spend (default 10). */
    @GetMapping("/customers/top")
    public List<TopCustomer> topCustomers(
            @AuthenticationPrincipal JwtPrincipal p,
            @RequestParam(defaultValue = "10") int limit) {
        requireAdmin(p);
        return adminAnalyticsService.topCustomers(p.tenantId(), Math.min(limit, 50));
    }

    /** Feedback star-rating distribution (1–5). */
    @GetMapping("/feedback/ratings")
    public List<RatingDistribution> feedbackRatings(@AuthenticationPrincipal JwtPrincipal p) {
        requireAdmin(p);
        return adminAnalyticsService.ratingDistribution(p.tenantId());
    }

    // ─── Guard ────────────────────────────────────────────────────────────────

    private static void requireAdmin(JwtPrincipal p) {
        if (!"ADMIN".equalsIgnoreCase(p.role())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Admin access required");
        }
    }
}
