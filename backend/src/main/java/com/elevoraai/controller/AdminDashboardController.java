package com.elevoraai.controller;

import com.elevoraai.config.SecurityConfig.JwtPrincipal;
import com.elevoraai.service.AdminDashboardService;
import com.elevoraai.service.AdminDashboardService.AdminDashboardData;
import java.util.List;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/admin/dashboard-real")
@PreAuthorize("hasRole('ADMIN')")
public class AdminDashboardController {

    private final AdminDashboardService adminDashboardService;

    public AdminDashboardController(AdminDashboardService adminDashboardService) {
        this.adminDashboardService = adminDashboardService;
    }

    @GetMapping
    public AdminDashboardData getDashboardData(@AuthenticationPrincipal JwtPrincipal principal) {
        return adminDashboardService.getAdminDashboardData(principal);
    }

    @GetMapping("/recent-users")
    public List<AdminDashboardService.RecentUser> getRecentUsers(@AuthenticationPrincipal JwtPrincipal principal) {
        return adminDashboardService.getRecentUsers(principal);
    }
}
