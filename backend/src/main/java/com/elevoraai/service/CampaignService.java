package com.elevoraai.service;

import com.elevoraai.config.SecurityConfig.JwtPrincipal;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import java.math.BigDecimal;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.util.List;
import java.util.Locale;
import org.springframework.http.HttpStatus;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

@Service
public class CampaignService {

    private final JdbcTemplate jdbcTemplate;

    public CampaignService(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    public List<CampaignResponse> listCampaigns(JwtPrincipal principal) {
        return jdbcTemplate.query(
                "SELECT id, tenant_id, name, platform, status, budget, spent, clicks, impressions, created_at "
                        + "FROM campaigns WHERE tenant_id = ? ORDER BY id DESC",
                this::mapCampaign,
                principal.tenantId());
    }

    @Transactional
    public CampaignResponse createCampaign(JwtPrincipal principal, CampaignRequest request) {
        jdbcTemplate.update(
                "INSERT INTO campaigns (tenant_id, name, platform, status, budget, spent, clicks, impressions) "
                        + "VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
                principal.tenantId(),
                request.name().trim(),
                request.platform().trim().toUpperCase(Locale.ROOT),
                request.status().trim().toUpperCase(Locale.ROOT),
                request.budget(),
                request.spent(),
                request.clicks(),
                request.impressions());

        Long id = jdbcTemplate.queryForObject(
                "SELECT id FROM campaigns WHERE tenant_id = ? AND name = ? ORDER BY id DESC LIMIT 1",
                Long.class,
                principal.tenantId(),
                request.name().trim());

        return getCampaignById(principal.tenantId(), id);
    }

    @Transactional
    public CampaignResponse updateCampaign(JwtPrincipal principal, Long id, CampaignRequest request) {
        int updated = jdbcTemplate.update(
                "UPDATE campaigns SET name = ?, platform = ?, status = ?, budget = ?, spent = ?, clicks = ?, impressions = ? "
                        + "WHERE tenant_id = ? AND id = ?",
                request.name().trim(),
                request.platform().trim().toUpperCase(Locale.ROOT),
                request.status().trim().toUpperCase(Locale.ROOT),
                request.budget(),
                request.spent(),
                request.clicks(),
                request.impressions(),
                principal.tenantId(),
                id);

        if (updated != 1) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Campaign not found");
        }
        return getCampaignById(principal.tenantId(), id);
    }

    @Transactional
    public void deleteCampaign(JwtPrincipal principal, Long id) {
        int updated = jdbcTemplate.update(
                "DELETE FROM campaigns WHERE tenant_id = ? AND id = ?",
                principal.tenantId(),
                id);
        if (updated != 1) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Campaign not found");
        }
    }

    @Transactional
    public CampaignResponse updateStatus(JwtPrincipal principal, Long id, String status) {
        String normalizedStatus = status.trim().toUpperCase(Locale.ROOT);
        if (!List.of("ACTIVE", "PAUSED", "COMPLETED", "ARCHIVED").contains(normalizedStatus)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid status");
        }
        int updated = jdbcTemplate.update(
                "UPDATE campaigns SET status = ? WHERE tenant_id = ? AND id = ?",
                normalizedStatus,
                principal.tenantId(),
                id);
        if (updated != 1) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Campaign not found");
        }
        return getCampaignById(principal.tenantId(), id);
    }

    private CampaignResponse getCampaignById(Long tenantId, Long id) {
        try {
            return jdbcTemplate.queryForObject(
                    "SELECT id, tenant_id, name, platform, status, budget, spent, clicks, impressions, created_at "
                            + "FROM campaigns WHERE tenant_id = ? AND id = ?",
                    this::mapCampaign,
                    tenantId,
                    id);
        } catch (org.springframework.dao.EmptyResultDataAccessException ex) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Campaign not found");
        }
    }

    private CampaignResponse mapCampaign(ResultSet rs, int rowNum) throws SQLException {
        return new CampaignResponse(
                rs.getLong("id"),
                rs.getLong("tenant_id"),
                rs.getString("name"),
                rs.getString("platform"),
                rs.getString("status"),
                rs.getBigDecimal("budget"),
                rs.getBigDecimal("spent"),
                rs.getInt("clicks"),
                rs.getInt("impressions"),
                rs.getTimestamp("created_at").toInstant());
    }

    public record CampaignRequest(
            @NotBlank @Size(max = 255) String name,
            @NotBlank @Pattern(regexp = "^(GOOGLE|META|LINKEDIN)$") String platform,
            @NotBlank @Pattern(regexp = "^(ACTIVE|PAUSED|COMPLETED|ARCHIVED)$") String status,
            @DecimalMin("0.00") BigDecimal budget,
            @DecimalMin("0.00") BigDecimal spent,
            @Min(0) int clicks,
            @Min(0) int impressions) {
    }

    public record CampaignResponse(
            Long id,
            Long tenantId,
            String name,
            String platform,
            String status,
            BigDecimal budget,
            BigDecimal spent,
            int clicks,
            int impressions,
            java.time.Instant createdAt) {
    }
}
