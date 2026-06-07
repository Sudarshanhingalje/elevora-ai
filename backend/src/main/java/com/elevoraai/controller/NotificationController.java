package com.elevoraai.controller;

import com.elevoraai.config.SecurityConfig.JwtPrincipal;
import com.elevoraai.service.NotificationService;
import com.elevoraai.service.NotificationService.NotificationResponse;
import java.util.List;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/notifications")
public class NotificationController {

    private final NotificationService notificationService;

    public NotificationController(NotificationService notificationService) {
        this.notificationService = notificationService;
    }

    /**
     * Returns the 50 most recent notifications for the authenticated user.
     * Scoped strictly to the tenant – no cross-tenant data is exposed.
     */
    @GetMapping
    public List<NotificationResponse> listMyNotifications(
            @AuthenticationPrincipal JwtPrincipal principal) {
        return notificationService.listForUser(principal.tenantId(), principal.userId());
    }

    @org.springframework.web.bind.annotation.PostMapping("/read")
    public void markAllAsRead(@AuthenticationPrincipal JwtPrincipal principal) {
        notificationService.markAllAsRead(principal.tenantId(), principal.userId());
    }
}
