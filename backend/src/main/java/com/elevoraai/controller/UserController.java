package com.elevoraai.controller;

import com.elevoraai.config.SecurityConfig.JwtPrincipal;
import com.elevoraai.service.UserService;
import com.elevoraai.service.UserService.ChangePasswordRequest;
import com.elevoraai.service.UserService.NotificationPrefsRequest;
import com.elevoraai.service.UserService.NotificationPrefsResponse;
import com.elevoraai.service.UserService.UpdateProfileRequest;
import com.elevoraai.service.UserService.UserProfileResponse;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/users/me")
public class UserController {

    private final UserService userService;

    public UserController(UserService userService) {
        this.userService = userService;
    }

    /** GET /api/users/me — current user profile */
    @GetMapping
    public UserProfileResponse getProfile(@AuthenticationPrincipal JwtPrincipal principal) {
        return userService.getProfile(principal.tenantId(), principal.userId());
    }

    /** PUT /api/users/me — update name & email */
    @PutMapping
    public UserProfileResponse updateProfile(
            @AuthenticationPrincipal JwtPrincipal principal,
            @RequestBody UpdateProfileRequest request) {
        return userService.updateProfile(principal.tenantId(), principal.userId(), request);
    }

    /** PUT /api/users/me/password — change password */
    @PutMapping("/password")
    public ResponseEntity<Void> changePassword(
            @AuthenticationPrincipal JwtPrincipal principal,
            @RequestBody ChangePasswordRequest request) {
        userService.changePassword(principal.tenantId(), principal.userId(), request);
        return ResponseEntity.noContent().build();
    }

    /** GET /api/users/me/notification-prefs — fetch prefs */
    @GetMapping("/notification-prefs")
    public NotificationPrefsResponse getNotificationPrefs(@AuthenticationPrincipal JwtPrincipal principal) {
        return userService.getNotificationPrefs(principal.tenantId(), principal.userId());
    }

    /** PUT /api/users/me/notification-prefs — save prefs */
    @PutMapping("/notification-prefs")
    public NotificationPrefsResponse saveNotificationPrefs(
            @AuthenticationPrincipal JwtPrincipal principal,
            @RequestBody NotificationPrefsRequest request) {
        return userService.saveNotificationPrefs(principal.tenantId(), principal.userId(), request);
    }
}
