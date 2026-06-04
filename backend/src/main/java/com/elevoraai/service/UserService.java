package com.elevoraai.service;

import java.sql.ResultSet;
import java.sql.SQLException;
import java.util.Optional;
import org.springframework.dao.EmptyResultDataAccessException;
import org.springframework.http.HttpStatus;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

@Service
public class UserService {

    private final JdbcTemplate jdbcTemplate;
    private final PasswordEncoder passwordEncoder;

    public UserService(JdbcTemplate jdbcTemplate, PasswordEncoder passwordEncoder) {
        this.jdbcTemplate = jdbcTemplate;
        this.passwordEncoder = passwordEncoder;
    }

    // -------------------------------------------------------------------------
    // Profile
    // -------------------------------------------------------------------------

    @Transactional(readOnly = true)
    public UserProfileResponse getProfile(Long tenantId, Long userId) {
        try {
            return jdbcTemplate.queryForObject(
                    "SELECT id, tenant_id, email, full_name, role FROM users WHERE tenant_id = ? AND id = ?",
                    this::mapProfile,
                    tenantId,
                    userId);
        } catch (EmptyResultDataAccessException ex) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found");
        }
    }

    @Transactional
    public UserProfileResponse updateProfile(Long tenantId, Long userId, UpdateProfileRequest request) {
        String name = request.name() == null ? null : request.name().trim();
        String email = request.email() == null ? null : request.email().trim().toLowerCase();

        if (email == null || email.isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Email is required");
        }

        // Check email uniqueness (ignore own record)
        Integer conflict = jdbcTemplate.queryForObject(
                "SELECT COUNT(1) FROM users WHERE tenant_id = ? AND email = ? AND id <> ?",
                Integer.class,
                tenantId, email, userId);
        if (conflict != null && conflict > 0) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Email already in use");
        }

        int updated = jdbcTemplate.update(
                "UPDATE users SET full_name = ?, email = ?, updated_at = CURRENT_TIMESTAMP WHERE tenant_id = ? AND id = ?",
                name, email, tenantId, userId);

        if (updated == 0) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found");
        }

        return getProfile(tenantId, userId);
    }

    // -------------------------------------------------------------------------
    // Password change
    // -------------------------------------------------------------------------

    @Transactional
    public void changePassword(Long tenantId, Long userId, ChangePasswordRequest request) {
        String currentHash = jdbcTemplate.queryForObject(
                "SELECT password_hash FROM users WHERE tenant_id = ? AND id = ?",
                String.class,
                tenantId, userId);

        if (currentHash == null || !passwordEncoder.matches(request.currentPassword(), currentHash)) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Current password is incorrect");
        }

        if (request.newPassword() == null || request.newPassword().length() < 8) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "New password must be at least 8 characters");
        }

        String newHash = passwordEncoder.encode(request.newPassword());
        jdbcTemplate.update(
                "UPDATE users SET password_hash = ?, updated_at = CURRENT_TIMESTAMP WHERE tenant_id = ? AND id = ?",
                newHash, tenantId, userId);
    }

    // -------------------------------------------------------------------------
    // Notification preferences
    // -------------------------------------------------------------------------

    @Transactional(readOnly = true)
    public NotificationPrefsResponse getNotificationPrefs(Long tenantId, Long userId) {
        try {
            return jdbcTemplate.queryForObject(
                    "SELECT email_notifs, in_app_notifs, billing_alerts, support_updates "
                            + "FROM user_notification_prefs WHERE tenant_id = ? AND user_id = ?",
                    this::mapPrefs,
                    tenantId, userId);
        } catch (EmptyResultDataAccessException ex) {
            // Return defaults when no record exists yet
            return new NotificationPrefsResponse(true, true, true, true);
        }
    }

    @Transactional
    public NotificationPrefsResponse saveNotificationPrefs(Long tenantId, Long userId, NotificationPrefsRequest request) {
        int updated = jdbcTemplate.update(
                "INSERT INTO user_notification_prefs (tenant_id, user_id, email_notifs, in_app_notifs, billing_alerts, support_updates) "
                        + "VALUES (?, ?, ?, ?, ?, ?) "
                        + "ON DUPLICATE KEY UPDATE "
                        + "email_notifs = VALUES(email_notifs), in_app_notifs = VALUES(in_app_notifs), "
                        + "billing_alerts = VALUES(billing_alerts), support_updates = VALUES(support_updates)",
                tenantId, userId,
                request.emailNotifs(), request.inAppNotifs(), request.billingAlerts(), request.supportUpdates());

        return getNotificationPrefs(tenantId, userId);
    }

    // -------------------------------------------------------------------------
    // Mappers & Records
    // -------------------------------------------------------------------------

    private UserProfileResponse mapProfile(ResultSet rs, int rowNum) throws SQLException {
        return new UserProfileResponse(
                rs.getLong("id"),
                rs.getLong("tenant_id"),
                rs.getString("email"),
                rs.getString("full_name"),
                rs.getString("role"));
    }

    private NotificationPrefsResponse mapPrefs(ResultSet rs, int rowNum) throws SQLException {
        return new NotificationPrefsResponse(
                rs.getBoolean("email_notifs"),
                rs.getBoolean("in_app_notifs"),
                rs.getBoolean("billing_alerts"),
                rs.getBoolean("support_updates"));
    }

    public record UpdateProfileRequest(String name, String email) {}

    public record ChangePasswordRequest(String currentPassword, String newPassword) {}

    public record NotificationPrefsRequest(
            boolean emailNotifs, boolean inAppNotifs, boolean billingAlerts, boolean supportUpdates) {}

    public record UserProfileResponse(Long id, Long tenantId, String email, String name, String role) {}

    public record NotificationPrefsResponse(
            boolean emailNotifs, boolean inAppNotifs, boolean billingAlerts, boolean supportUpdates) {}
}
