package com.elevoraai.service;

import com.elevoraai.config.SecurityConfig.JwtPrincipal;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.sql.Timestamp;
import java.time.Instant;
import java.time.LocalDateTime;
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

@Service
public class EmailCampaignService {

    private final JdbcTemplate jdbc;

    public EmailCampaignService(JdbcTemplate jdbc) {
        this.jdbc = jdbc;
    }

    // ── List all email campaigns for admin tenant ──────────────────────────
    public List<EmailCampaignResponse> listCampaigns(JwtPrincipal principal) {
        return jdbc.query(
                "SELECT id, tenant_id, campaign_name, subject_line, preview_text, headline, "
                        + "body_html, cta_text, cta_url, target_audience, products_promoted, "
                        + "status, sent_count, open_rate, click_rate, scheduled_at, sent_at, created_at "
                        + "FROM email_campaigns WHERE tenant_id = ? ORDER BY created_at DESC",
                this::mapRow,
                principal.tenantId());
    }

    // ── Create ─────────────────────────────────────────────────────────────
    @Transactional
    public EmailCampaignResponse createCampaign(JwtPrincipal principal, EmailCampaignRequest req) {
        jdbc.update(
                "INSERT INTO email_campaigns "
                        + "(tenant_id, campaign_name, subject_line, preview_text, headline, "
                        + "body_html, cta_text, cta_url, target_audience, products_promoted, status, scheduled_at) "
                        + "VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
                principal.tenantId(),
                req.campaignName().trim(),
                req.subjectLine().trim(),
                nullSafe(req.previewText()),
                nullSafe(req.headline()),
                nullSafe(req.bodyHtml()),
                nullSafe(req.ctaText()),
                nullSafe(req.ctaUrl()),
                nullSafe(req.targetAudience()),
                nullSafe(req.productsPromoted()),
                req.status() != null ? req.status().trim() : "DRAFT",
                req.scheduledAt() != null ? Timestamp.valueOf(req.scheduledAt()) : null);

        Long id = jdbc.queryForObject(
                "SELECT id FROM email_campaigns WHERE tenant_id = ? AND campaign_name = ? ORDER BY id DESC LIMIT 1",
                Long.class,
                principal.tenantId(),
                req.campaignName().trim());

        return getCampaign(principal.tenantId(), id);
    }

    // ── Update ─────────────────────────────────────────────────────────────
    @Transactional
    public EmailCampaignResponse updateCampaign(JwtPrincipal principal, Long id, EmailCampaignRequest req) {
        int rows = jdbc.update(
                "UPDATE email_campaigns SET campaign_name=?, subject_line=?, preview_text=?, headline=?, "
                        + "body_html=?, cta_text=?, cta_url=?, target_audience=?, products_promoted=?, status=?, scheduled_at=? "
                        + "WHERE tenant_id=? AND id=?",
                req.campaignName().trim(),
                req.subjectLine().trim(),
                nullSafe(req.previewText()),
                nullSafe(req.headline()),
                nullSafe(req.bodyHtml()),
                nullSafe(req.ctaText()),
                nullSafe(req.ctaUrl()),
                nullSafe(req.targetAudience()),
                nullSafe(req.productsPromoted()),
                req.status() != null ? req.status().trim() : "DRAFT",
                req.scheduledAt() != null ? Timestamp.valueOf(req.scheduledAt()) : null,
                principal.tenantId(),
                id);

        if (rows != 1) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Email campaign not found");
        }
        return getCampaign(principal.tenantId(), id);
    }

    // ── Delete ─────────────────────────────────────────────────────────────
    @Transactional
    public void deleteCampaign(JwtPrincipal principal, Long id) {
        int deleted = jdbc.update(
                "DELETE FROM email_campaigns WHERE tenant_id=? AND id=?",
                principal.tenantId(), id);
        if (deleted != 1) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Email campaign not found");
        }
    }

    // ── Send / Mark Sent ───────────────────────────────────────────────────
    @Transactional
    public EmailCampaignResponse markSent(JwtPrincipal principal, Long id, int sentCount) {
        jdbc.update(
                "UPDATE email_campaigns SET status='SENT', sent_count=?, sent_at=NOW() WHERE tenant_id=? AND id=?",
                sentCount, principal.tenantId(), id);
        return getCampaign(principal.tenantId(), id);
    }

    // ── Internal helpers ───────────────────────────────────────────────────
    private EmailCampaignResponse getCampaign(Long tenantId, Long id) {
        try {
            return jdbc.queryForObject(
                    "SELECT id, tenant_id, campaign_name, subject_line, preview_text, headline, "
                            + "body_html, cta_text, cta_url, target_audience, products_promoted, "
                            + "status, sent_count, open_rate, click_rate, scheduled_at, sent_at, created_at "
                            + "FROM email_campaigns WHERE tenant_id=? AND id=?",
                    this::mapRow,
                    tenantId, id);
        } catch (Exception e) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Email campaign not found");
        }
    }

    private EmailCampaignResponse mapRow(ResultSet rs, int rn) throws SQLException {
        Timestamp sched = rs.getTimestamp("scheduled_at");
        Timestamp sent  = rs.getTimestamp("sent_at");
        return new EmailCampaignResponse(
                rs.getLong("id"),
                rs.getLong("tenant_id"),
                rs.getString("campaign_name"),
                rs.getString("subject_line"),
                rs.getString("preview_text"),
                rs.getString("headline"),
                rs.getString("body_html"),
                rs.getString("cta_text"),
                rs.getString("cta_url"),
                rs.getString("target_audience"),
                rs.getString("products_promoted"),
                rs.getString("status"),
                rs.getInt("sent_count"),
                rs.getBigDecimal("open_rate"),
                rs.getBigDecimal("click_rate"),
                sched == null ? null : sched.toLocalDateTime(),
                sent  == null ? null : sent.toInstant(),
                rs.getTimestamp("created_at").toInstant());
    }

    private String nullSafe(String val) {
        return (val == null || val.isBlank()) ? null : val.trim();
    }

    // ── DTOs ──────────────────────────────────────────────────────────────
    public record EmailCampaignRequest(
            @NotBlank @Size(max = 255) String campaignName,
            @NotBlank @Size(max = 500) String subjectLine,
            @Size(max = 200)           String previewText,
            @Size(max = 500)           String headline,
                                       String bodyHtml,
            @Size(max = 255)           String ctaText,
            @Size(max = 500)           String ctaUrl,
            @Size(max = 500)           String targetAudience,
                                       String productsPromoted,
            @Size(max = 50)            String status,
                                       LocalDateTime scheduledAt) {
    }

    public record EmailCampaignResponse(
            Long             id,
            Long             tenantId,
            String           campaignName,
            String           subjectLine,
            String           previewText,
            String           headline,
            String           bodyHtml,
            String           ctaText,
            String           ctaUrl,
            String           targetAudience,
            String           productsPromoted,
            String           status,
            int              sentCount,
            java.math.BigDecimal openRate,
            java.math.BigDecimal clickRate,
            LocalDateTime    scheduledAt,
            Instant          sentAt,
            Instant          createdAt) {
    }
}
