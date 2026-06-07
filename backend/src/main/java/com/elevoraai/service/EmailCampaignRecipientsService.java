package com.elevoraai.service;

import com.elevoraai.config.SecurityConfig.JwtPrincipal;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.time.Instant;
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

@Service
public class EmailCampaignRecipientsService {

    private final JdbcTemplate jdbc;

    public EmailCampaignRecipientsService(JdbcTemplate jdbc) {
        this.jdbc = jdbc;
    }

    /** List all recipients for a campaign (admin-scoped) */
    public List<RecipientResponse> listRecipients(JwtPrincipal principal, Long campaignId) {
        assertCampaignOwner(principal, campaignId);
        return jdbc.query(
                "SELECT id, campaign_id, email, name, status, sent_at, fail_reason, queue_position, created_at "
                        + "FROM email_campaign_recipients WHERE campaign_id = ? ORDER BY queue_position, id",
                this::mapRow,
                campaignId);
    }

    /** Bulk-add recipients (skips duplicates via INSERT IGNORE) */
    @Transactional
    public int addRecipients(JwtPrincipal principal, Long campaignId, List<RecipientRequest> recipients) {
        assertCampaignOwner(principal, campaignId);

        // Get current max queue_position
        Integer maxPos = jdbc.queryForObject(
                "SELECT COALESCE(MAX(queue_position), 0) FROM email_campaign_recipients WHERE campaign_id = ?",
                Integer.class, campaignId);
        int pos = maxPos == null ? 0 : maxPos;

        int inserted = 0;
        for (RecipientRequest r : recipients) {
            try {
                int rows = jdbc.update(
                        "INSERT IGNORE INTO email_campaign_recipients "
                                + "(campaign_id, tenant_id, email, name, status, queue_position) "
                                + "VALUES (?, ?, ?, ?, 'QUEUED', ?)",
                        campaignId,
                        principal.tenantId(),
                        r.email().trim().toLowerCase(),
                        r.name() != null ? r.name().trim() : null,
                        ++pos);
                inserted += rows;
            } catch (Exception ignored) { /* skip duplicates */ }
        }
        return inserted;
    }

    /** Remove a single recipient */
    @Transactional
    public void removeRecipient(JwtPrincipal principal, Long campaignId, Long recipientId) {
        assertCampaignOwner(principal, campaignId);
        jdbc.update(
                "DELETE FROM email_campaign_recipients WHERE id = ? AND campaign_id = ?",
                recipientId, campaignId);
    }

    /** Reset all FAILED recipients back to QUEUED so they can be retried */
    @Transactional
    public int resetFailed(JwtPrincipal principal, Long campaignId) {
        assertCampaignOwner(principal, campaignId);
        return jdbc.update(
                "UPDATE email_campaign_recipients SET status = 'QUEUED', fail_reason = NULL, sent_at = NULL "
                        + "WHERE campaign_id = ? AND status = 'FAILED'",
                campaignId);
    }

    /** Stats: how many QUEUED / SENT / FAILED */
    public RecipientStats getStats(Long campaignId) {
        Integer queued = jdbc.queryForObject(
                "SELECT COUNT(*) FROM email_campaign_recipients WHERE campaign_id = ? AND status = 'QUEUED'",
                Integer.class, campaignId);
        Integer sent = jdbc.queryForObject(
                "SELECT COUNT(*) FROM email_campaign_recipients WHERE campaign_id = ? AND status = 'SENT'",
                Integer.class, campaignId);
        Integer failed = jdbc.queryForObject(
                "SELECT COUNT(*) FROM email_campaign_recipients WHERE campaign_id = ? AND status = 'FAILED'",
                Integer.class, campaignId);
        return new RecipientStats(
                queued  == null ? 0 : queued,
                sent    == null ? 0 : sent,
                failed  == null ? 0 : failed);
    }

    // ── Internal ─────────────────────────────────────────────────────────────
    private void assertCampaignOwner(JwtPrincipal principal, Long campaignId) {
        Integer count = jdbc.queryForObject(
                "SELECT COUNT(*) FROM email_campaigns WHERE id = ? AND tenant_id = ?",
                Integer.class, campaignId, principal.tenantId());
        if (count == null || count == 0) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Campaign not found");
        }
    }

    private RecipientResponse mapRow(ResultSet rs, int rn) throws SQLException {
        java.sql.Timestamp sentAt = rs.getTimestamp("sent_at");
        return new RecipientResponse(
                rs.getLong("id"),
                rs.getLong("campaign_id"),
                rs.getString("email"),
                rs.getString("name"),
                rs.getString("status"),
                sentAt == null ? null : sentAt.toInstant(),
                rs.getString("fail_reason"),
                rs.getInt("queue_position"),
                rs.getTimestamp("created_at").toInstant());
    }

    // ── DTOs ─────────────────────────────────────────────────────────────────
    public record RecipientRequest(
            @NotBlank @Email String email,
            String name) {
    }

    public record RecipientResponse(
            Long id,
            Long campaignId,
            String email,
            String name,
            String status,
            Instant sentAt,
            String failReason,
            int queuePosition,
            Instant createdAt) {
    }

    public record RecipientStats(int queued, int sent, int failed) {
        public int total() { return queued + sent + failed; }
    }

    public record BulkAddRequest(
            @NotEmpty List<RecipientRequest> recipients) {
    }
}
