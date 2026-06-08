package com.elevoraai.controller;

import com.elevoraai.config.SecurityConfig.JwtPrincipal;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.Size;
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
            @Valid @RequestBody SubmitFeedbackRequest request) {
        jdbcTemplate.update(
                "INSERT INTO feedback (tenant_id, user_id, rating, nps_score, category, message, source, solution_quality, communication, delivery_speed, recommend, ticket_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
                principal.tenantId(),
                principal.userId(),
                request.rating(),
                request.npsScore(),
                request.category() != null ? request.category() : "GENERAL",
                request.message(),
                request.source() != null ? request.source() : "PROJECT",
                request.solutionQuality(),
                request.communication(),
                request.deliverySpeed(),
                request.recommend(),
                request.ticketId());
        return ResponseEntity.ok(new FeedbackStatus("success", "Thank you for your feedback!"));
    }

    @GetMapping("/public")
    public List<PublicFeedbackResponse> listPublicFeedback() {
        return jdbcTemplate.query(
                "SELECT f.rating, f.message, COALESCE(u.full_name, u.name, 'Valued Client') AS client_name, f.category "
                        + "FROM feedback f JOIN users u ON u.id = f.user_id "
                        + "WHERE f.rating >= 4 "
                        + "ORDER BY f.created_at DESC LIMIT 10",
                (rs, rowNum) -> new PublicFeedbackResponse(
                        rs.getInt("rating"),
                        rs.getString("message"),
                        rs.getString("client_name"),
                        rs.getString("category")
                ));
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

    public record SubmitFeedbackRequest(
            @Min(value = 1, message = "Rating must be at least 1")
            @Max(value = 5, message = "Rating cannot exceed 5")
            int rating,
            Integer npsScore,
            String category,
            @Size(max = 2000, message = "Feedback message cannot exceed 2000 characters")
            String message,
            String source,
            Integer solutionQuality,
            Integer communication,
            Integer deliverySpeed,
            Integer recommend,
            Long ticketId) {
    }

    public record FeedbackStatus(String status, String message) {
    }

    public record FeedbackResponse(Long id, Long tenantId, Long userId, String email, int rating, String message, Instant createdAt) {
    }

    public record PublicFeedbackResponse(int rating, String message, String clientName, String category) {
    }
}
