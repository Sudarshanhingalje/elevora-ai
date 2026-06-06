package com.elevoraai.service;

import com.elevoraai.config.SecurityConfig.JwtPrincipal;
import jakarta.validation.constraints.FutureOrPresent;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.sql.Timestamp;
import java.time.LocalDateTime;
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

@Service
public class CampaignPostService {

    private final JdbcTemplate jdbcTemplate;

    public CampaignPostService(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    public List<CampaignPostResponse> listCampaignPosts(JwtPrincipal principal) {
        return jdbcTemplate.query(
                "SELECT id, tenant_id, campaign, title, content, hashtags, image_prompt, platforms, schedule_datetime, generated_image_url, status, created_at "
                        + "FROM campaign_posts WHERE tenant_id = ? ORDER BY schedule_datetime DESC, id DESC",
                this::mapCampaignPost,
                principal.tenantId());
    }

    @Transactional
    public CampaignPostResponse createCampaignPost(JwtPrincipal principal, CampaignPostRequest request) {
        jdbcTemplate.update(
                "INSERT INTO campaign_posts (tenant_id, campaign, title, content, hashtags, image_prompt, platforms, schedule_datetime, status) "
                        + "VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'SCHEDULED')",
                principal.tenantId(),
                request.campaign().trim(),
                request.title().trim(),
                request.content().trim(),
                normalizeOptional(request.hashtags()),
                normalizeOptional(request.imagePrompt()),
                request.platforms().trim(),
                Timestamp.valueOf(request.scheduleDatetime()));

        Long id = jdbcTemplate.queryForObject(
                "SELECT id FROM campaign_posts WHERE tenant_id = ? AND title = ? ORDER BY id DESC LIMIT 1",
                Long.class,
                principal.tenantId(),
                request.title().trim());

        return getCampaignPost(principal.tenantId(), id);
    }

    @Transactional
    public CampaignPostResponse updateCampaignPost(JwtPrincipal principal, Long id, CampaignPostRequest request) {
        int updated = jdbcTemplate.update(
                "UPDATE campaign_posts SET campaign = ?, title = ?, content = ?, hashtags = ?, image_prompt = ?, platforms = ?, schedule_datetime = ? "
                        + "WHERE tenant_id = ? AND id = ?",
                request.campaign().trim(),
                request.title().trim(),
                request.content().trim(),
                normalizeOptional(request.hashtags()),
                normalizeOptional(request.imagePrompt()),
                request.platforms().trim(),
                Timestamp.valueOf(request.scheduleDatetime()),
                principal.tenantId(),
                id);

        if (updated != 1) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Campaign post not found");
        }
        return getCampaignPost(principal.tenantId(), id);
    }

    @Transactional
    public void deleteCampaignPost(JwtPrincipal principal, Long id) {
        int deleted = jdbcTemplate.update("DELETE FROM campaign_posts WHERE tenant_id = ? AND id = ?", principal.tenantId(), id);
        if (deleted != 1) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Campaign post not found");
        }
    }

    /**
     * Called by the n8n callback controller after publishing succeeds or fails.
     * Does not require a tenant check — the shared secret provides the auth guarantee.
     */
    @Transactional
    public void updatePostStatus(Long id, String status, String generatedImageUrl) {
        int updated;
        if (generatedImageUrl != null && !generatedImageUrl.isBlank()) {
            updated = jdbcTemplate.update(
                    "UPDATE campaign_posts SET status = ?, generated_image_url = ? WHERE id = ?",
                    status, generatedImageUrl.trim(), id);
        } else {
            updated = jdbcTemplate.update(
                    "UPDATE campaign_posts SET status = ? WHERE id = ?",
                    status, id);
        }
        if (updated == 0) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Campaign post not found: " + id);
        }
    }

    public CampaignPostResponse getCampaignPost(Long tenantId, Long id) {
        try {
            return jdbcTemplate.queryForObject(
                    "SELECT id, tenant_id, campaign, title, content, hashtags, image_prompt, platforms, schedule_datetime, generated_image_url, status, created_at "
                            + "FROM campaign_posts WHERE tenant_id = ? AND id = ?",
                    this::mapCampaignPost,
                    tenantId,
                    id);
        } catch (Exception ex) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Campaign post not found");
        }
    }

    private CampaignPostResponse mapCampaignPost(ResultSet rs, int rowNum) throws SQLException {
        Timestamp sched = rs.getTimestamp("schedule_datetime");
        return new CampaignPostResponse(
                rs.getLong("id"),
                rs.getLong("tenant_id"),
                rs.getString("campaign"),
                rs.getString("title"),
                rs.getString("content"),
                rs.getString("hashtags"),
                rs.getString("image_prompt"),
                rs.getString("platforms"),
                sched == null ? null : sched.toLocalDateTime(),
                rs.getString("generated_image_url"),
                rs.getString("status"),
                rs.getTimestamp("created_at").toInstant());
    }

    private String normalizeOptional(String val) {
        return (val == null || val.trim().isEmpty()) ? null : val.trim();
    }

    public record CampaignPostRequest(
            @NotBlank @Size(max = 255) String campaign,
            @NotBlank @Size(max = 255) String title,
            @NotBlank String content,
            @Size(max = 500) String hashtags,
            String imagePrompt,
            @NotBlank String platforms,
            @FutureOrPresent LocalDateTime scheduleDatetime) {
    }

    public record CampaignPostResponse(
            Long id,
            Long tenantId,
            String campaign,
            String title,
            String content,
            String hashtags,
            String imagePrompt,
            String platforms,
            LocalDateTime scheduleDatetime,
            String generatedImageUrl,
            String status,
            java.time.Instant createdAt) {
    }
}
