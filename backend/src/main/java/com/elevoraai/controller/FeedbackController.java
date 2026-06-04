package com.elevoraai.controller;

import com.elevoraai.config.SecurityConfig.JwtPrincipal;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.time.Instant;
import java.util.List;
import org.springframework.http.ResponseEntity;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/feedback")
public class FeedbackController {

    private final JdbcTemplate jdbcTemplate;

    public FeedbackController(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    @PostMapping
    public ResponseEntity<FeedbackStatus> submitFeedback(
            @AuthenticationPrincipal JwtPrincipal principal,
            @RequestBody SubmitFeedbackRequest request) {
        jdbcTemplate.update(
                "INSERT INTO feedback (tenant_id, user_id, rating, nps_score, category, message) VALUES (?, ?, ?, ?, ?, ?)",
                principal.tenantId(),
                principal.userId(),
                request.rating(),
                request.npsScore(),
                request.category() != null ? request.category() : "GENERAL",
                request.message());
        return ResponseEntity.ok(new FeedbackStatus("success", "Thank you for your feedback!"));
    }

    @PreAuthorize("hasRole('ADMIN')")
    @GetMapping
    public List<FeedbackResponse> listFeedback(@AuthenticationPrincipal JwtPrincipal principal) {
        return jdbcTemplate.query(
                "SELECT f.id, f.tenant_id, f.user_id, f.rating, f.message, f.created_at, u.email "
                        + "FROM feedback f JOIN users u ON u.id = f.user_id WHERE f.tenant_id = ? "
                        + "ORDER BY f.created_at DESC",
                this::mapFeedback,
                principal.tenantId());
    }

    private FeedbackResponse mapFeedback(ResultSet rs, int rowNum) throws SQLException {
        return new FeedbackResponse(
                rs.getLong("id"),
                rs.getLong("tenant_id"),
                rs.getLong("user_id"),
                rs.getString("email"),
                rs.getInt("rating"),
                rs.getString("message"),
                rs.getTimestamp("created_at").toInstant());
    }

    public record SubmitFeedbackRequest(int rating, Integer npsScore, String category, String message) {
    }

    public record FeedbackStatus(String status, String message) {
    }

    public record FeedbackResponse(Long id, Long tenantId, Long userId, String email, int rating, String message, Instant createdAt) {
    }
}
