package com.elevoraai.service;

import java.sql.ResultSet;
import java.sql.SQLException;
import java.time.Instant;
import java.util.List;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class NotificationService {

    private final JdbcTemplate jdbcTemplate;
    private final EmailService emailService;

    public NotificationService(JdbcTemplate jdbcTemplate, EmailService emailService) {
        this.jdbcTemplate = jdbcTemplate;
        this.emailService = emailService;
    }

    @Transactional
    public void notifyUser(Long tenantId, Long userId, String title, String body) {
        jdbcTemplate.update(
                "INSERT INTO notifications (tenant_id, user_id, channel, title, body, status) VALUES (?, ?, 'IN_APP', ?, ?, 'SENT')",
                tenantId,
                userId,
                title,
                body);
        String email = jdbcTemplate.queryForObject(
                "SELECT email FROM users WHERE tenant_id = ? AND id = ?",
                String.class,
                tenantId,
                userId);
        if (email != null && emailService.send(email, title, body)) {
            jdbcTemplate.update(
                    "INSERT INTO notifications (tenant_id, user_id, channel, title, body, status, sent_at) VALUES (?, ?, 'EMAIL', ?, ?, 'SENT', CURRENT_TIMESTAMP)",
                    tenantId,
                    userId,
                    title,
                    body);
        }
    }

    public List<NotificationResponse> listForUser(Long tenantId, Long userId) {
        return jdbcTemplate.query(
                "SELECT id, tenant_id, user_id, channel, title, body, status, created_at, sent_at, read_at "
                        + "FROM notifications WHERE tenant_id = ? AND user_id = ? AND read_at IS NULL ORDER BY created_at DESC, id DESC LIMIT 50",
                this::mapNotification,
                tenantId,
                userId);
    }

    @Transactional
    public void markAllAsRead(Long tenantId, Long userId) {
        jdbcTemplate.update(
                "UPDATE notifications SET read_at = CURRENT_TIMESTAMP WHERE tenant_id = ? AND user_id = ? AND channel = 'IN_APP' AND read_at IS NULL",
                tenantId,
                userId);
    }

    private NotificationResponse mapNotification(ResultSet rs, int rowNum) throws SQLException {
        return new NotificationResponse(
                rs.getLong("id"),
                rs.getLong("tenant_id"),
                rs.getLong("user_id"),
                rs.getString("channel"),
                rs.getString("title"),
                rs.getString("body"),
                rs.getString("status"),
                rs.getTimestamp("created_at").toInstant(),
                rs.getTimestamp("sent_at") == null ? null : rs.getTimestamp("sent_at").toInstant(),
                rs.getTimestamp("read_at") == null ? null : rs.getTimestamp("read_at").toInstant());
    }

    public record NotificationResponse(Long id, Long tenantId, Long userId, String channel, String title, String body, String status, Instant createdAt, Instant sentAt, Instant readAt) {
    }
}
