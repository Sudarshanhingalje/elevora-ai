package com.elevoraai.controller;

import com.elevoraai.config.SecurityConfig.JwtPrincipal;
import com.elevoraai.service.DashboardService;
import com.elevoraai.service.DashboardService.AdminDashboardResponse;
import com.elevoraai.service.DashboardService.UserDashboardResponse;
import com.elevoraai.service.UserActivityService;
import com.elevoraai.service.UserActivityService.ActivityLogResponse;
import java.util.List;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/dashboard")
public class DashboardController {

    private final DashboardService dashboardService;
    private final UserActivityService userActivityService;

    public DashboardController(DashboardService dashboardService, UserActivityService userActivityService) {
        this.dashboardService = dashboardService;
        this.userActivityService = userActivityService;
    }

    @GetMapping("/me")
    public UserDashboardResponse userDashboard(Authentication authentication) {
        JwtPrincipal principal = principal(authentication);
        return dashboardService.userDashboard(principal.tenantId(), principal.userId(), principal.role());
    }

    @GetMapping("/activities")
    public List<ActivityLogResponse> userActivities(Authentication authentication) {
        JwtPrincipal principal = principal(authentication);
        return userActivityService.listLogs(principal.tenantId(), principal.userId());
    }

    @PreAuthorize("hasRole('ADMIN')")
    @GetMapping("/admin")
    public AdminDashboardResponse adminDashboard(Authentication authentication) {
        JwtPrincipal principal = principal(authentication);
        return dashboardService.adminDashboard(principal.tenantId(), principal.role());
    }

    @PreAuthorize("hasRole('ADMIN')")
    @GetMapping("/admin/orders")
    public List<DashboardService.OrderSummary> paginatedOrders(
            Authentication authentication,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "5") int size) {
        JwtPrincipal principal = principal(authentication);
        return dashboardService.paginatedOrders(principal.tenantId(), page, size);
    }

    private JwtPrincipal principal(Authentication authentication) {
        if (authentication == null || !(authentication.getPrincipal() instanceof JwtPrincipal jwtPrincipal)) {
            throw new IllegalStateException("Authenticated JWT principal is required");
        }
        return jwtPrincipal;
    }
}

