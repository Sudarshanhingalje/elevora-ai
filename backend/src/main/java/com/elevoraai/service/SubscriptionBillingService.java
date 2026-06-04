package com.elevoraai.service;

import com.elevoraai.config.SecurityConfig.JwtPrincipal;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import java.math.BigDecimal;
import java.sql.Date;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.time.LocalDate;
import java.util.List;
import java.util.Locale;
import java.util.UUID;
import org.springframework.http.HttpStatus;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

@Service
public class SubscriptionBillingService {

    private final JdbcTemplate jdbcTemplate;

    public SubscriptionBillingService(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    public List<PlanResponse> listPlans(JwtPrincipal principal) {
        seedPlansIfMissing(principal.tenantId());
        return jdbcTemplate.query(
                "SELECT id, tenant_id, code, name, monthly_price, product_limit, agent_limit, razorpay_plan_id, status "
                        + "FROM subscription_plans WHERE tenant_id = ? AND status = 'ACTIVE' ORDER BY monthly_price ASC",
                this::mapPlan,
                principal.tenantId());
    }

    public CurrentSubscriptionResponse currentSubscription(JwtPrincipal principal) {
        try {
            return jdbcTemplate.queryForObject(
                    "SELECT id, tenant_id, user_id, plan, status, razorpay_subscription_id, start_date, end_date "
                            + "FROM subscriptions WHERE tenant_id = ? AND user_id = ? ORDER BY id DESC LIMIT 1",
                    this::mapSubscription,
                    principal.tenantId(),
                    principal.userId());
        } catch (RuntimeException ex) {
            return new CurrentSubscriptionResponse(null, principal.tenantId(), principal.userId(), "BASIC", "INACTIVE", null, null, null);
        }
    }

    @Transactional
    public CurrentSubscriptionResponse createSubscription(JwtPrincipal principal, SubscribeRequest request) {
        String plan = normalizePlan(request.plan());
        seedPlansIfMissing(principal.tenantId());
        PlanResponse planResponse = jdbcTemplate.queryForObject(
                "SELECT id, tenant_id, code, name, monthly_price, product_limit, agent_limit, razorpay_plan_id, status "
                        + "FROM subscription_plans WHERE tenant_id = ? AND code = ? AND status = 'ACTIVE'",
                this::mapPlan,
                principal.tenantId(),
                plan);
        String razorpaySubscriptionId = "local_sub_" + UUID.randomUUID();
        LocalDate start = LocalDate.now();
        LocalDate end = start.plusMonths(1);
        jdbcTemplate.update(
                "INSERT INTO subscriptions (tenant_id, user_id, plan, status, razorpay_subscription_id, start_date, end_date) "
                        + "VALUES (?, ?, ?, 'ACTIVE', ?, ?, ?)",
                principal.tenantId(),
                principal.userId(),
                planResponse.code(),
                razorpaySubscriptionId,
                Date.valueOf(start),
                Date.valueOf(end));
        jdbcTemplate.update(
                "UPDATE tenants SET plan = ? WHERE tenant_id = id AND id = ?",
                plan,
                principal.tenantId());
        return currentSubscription(principal);
    }

    public boolean canUseFeature(JwtPrincipal principal, String featureCode) {
        CurrentSubscriptionResponse subscription = currentSubscription(principal);
        String plan = subscription.status().equals("ACTIVE") ? subscription.plan() : "BASIC";
        return switch (featureCode.trim().toUpperCase(Locale.ROOT)) {
            case "GYM_AI", "CRM_AI" -> true;
            case "SOCIAL_AGENT" -> List.of("PRO", "ENTERPRISE").contains(plan);
            case "CONTENT_AGENT", "UNLIMITED_PRODUCTS" -> "ENTERPRISE".equals(plan);
            default -> false;
        };
    }

    private void seedPlansIfMissing(Long tenantId) {
        Integer count = jdbcTemplate.queryForObject(
                "SELECT COUNT(*) FROM subscription_plans WHERE tenant_id = ?",
                Integer.class,
                tenantId);
        if (count != null && count > 0) {
            return;
        }
        jdbcTemplate.update(
                "INSERT INTO subscription_plans (tenant_id, code, name, monthly_price, product_limit, agent_limit, status) VALUES "
                        + "(?, 'BASIC', 'Basic', 999.00, 3, 0, 'ACTIVE'), "
                        + "(?, 'PRO', 'Pro', 2999.00, 15, 2, 'ACTIVE'), "
                        + "(?, 'ENTERPRISE', 'Enterprise', 9999.00, 100, 10, 'ACTIVE')",
                tenantId,
                tenantId,
                tenantId);
    }

    private PlanResponse mapPlan(ResultSet rs, int rowNum) throws SQLException {
        return new PlanResponse(
                rs.getLong("id"),
                rs.getLong("tenant_id"),
                rs.getString("code"),
                rs.getString("name"),
                rs.getBigDecimal("monthly_price"),
                rs.getInt("product_limit"),
                rs.getInt("agent_limit"),
                rs.getString("razorpay_plan_id"),
                rs.getString("status"));
    }

    private CurrentSubscriptionResponse mapSubscription(ResultSet rs, int rowNum) throws SQLException {
        Date startDate = rs.getDate("start_date");
        Date endDate = rs.getDate("end_date");
        return new CurrentSubscriptionResponse(
                rs.getLong("id"),
                rs.getLong("tenant_id"),
                rs.getLong("user_id"),
                rs.getString("plan"),
                rs.getString("status"),
                rs.getString("razorpay_subscription_id"),
                startDate == null ? null : startDate.toLocalDate(),
                endDate == null ? null : endDate.toLocalDate());
    }

    private String normalizePlan(String plan) {
        String normalized = plan.trim().toUpperCase(Locale.ROOT);
        if (!List.of("BASIC", "PRO", "ENTERPRISE").contains(normalized)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid subscription plan");
        }
        return normalized;
    }

    public record SubscribeRequest(@NotBlank @Pattern(regexp = "^(BASIC|PRO|ENTERPRISE)$") String plan) {
    }

    public record PlanResponse(
            Long id,
            Long tenantId,
            String code,
            String name,
            BigDecimal monthlyPrice,
            Integer productLimit,
            Integer agentLimit,
            String razorpayPlanId,
            String status) {
    }

    public record CurrentSubscriptionResponse(
            Long id,
            Long tenantId,
            Long userId,
            String plan,
            String status,
            String razorpaySubscriptionId,
            LocalDate startDate,
            LocalDate endDate) {
    }
}
