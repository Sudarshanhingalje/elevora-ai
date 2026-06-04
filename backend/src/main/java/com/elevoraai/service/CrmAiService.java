package com.elevoraai.service;

import com.elevoraai.config.SecurityConfig.JwtPrincipal;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import java.math.BigDecimal;
import java.sql.Date;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.time.LocalDate;
import java.util.List;
import java.util.Locale;
import org.springframework.http.HttpStatus;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;
import org.springframework.web.server.ResponseStatusException;

@Service
public class CrmAiService {

    private final JdbcTemplate jdbcTemplate;

    public CrmAiService(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    public List<LeadResponse> listLeads(JwtPrincipal principal, String stage) {
        if (StringUtils.hasText(stage)) {
            return jdbcTemplate.query(
                    "SELECT id, tenant_id, company_name, contact_name, email, phone, stage, value, source, next_follow_up, created_at "
                            + "FROM crm_leads WHERE tenant_id = ? AND stage = ? ORDER BY updated_at DESC, id DESC",
                    this::mapLead,
                    principal.tenantId(),
                    normalizeStage(stage));
        }
        return jdbcTemplate.query(
                "SELECT id, tenant_id, company_name, contact_name, email, phone, stage, value, source, next_follow_up, created_at "
                        + "FROM crm_leads WHERE tenant_id = ? ORDER BY updated_at DESC, id DESC",
                this::mapLead,
                principal.tenantId());
    }

    @Transactional
    public LeadResponse createLead(JwtPrincipal principal, LeadRequest request) {
        jdbcTemplate.update(
                "INSERT INTO crm_leads (tenant_id, company_name, contact_name, email, phone, stage, value, source, next_follow_up) "
                        + "VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)",
                principal.tenantId(),
                request.companyName().trim(),
                request.contactName().trim(),
                request.email().trim().toLowerCase(Locale.ROOT),
                normalizeOptional(request.phone()),
                normalizeStage(request.stage()),
                request.value(),
                request.source().trim(),
                request.nextFollowUp() == null ? null : Date.valueOf(request.nextFollowUp()));
        Long id = jdbcTemplate.queryForObject(
                "SELECT id FROM crm_leads WHERE tenant_id = ? AND email = ? ORDER BY id DESC LIMIT 1",
                Long.class,
                principal.tenantId(),
                request.email().trim().toLowerCase(Locale.ROOT));
        return getLead(principal.tenantId(), id);
    }

    @Transactional
    public LeadResponse updateLead(JwtPrincipal principal, Long leadId, LeadRequest request) {
        int updated = jdbcTemplate.update(
                "UPDATE crm_leads SET company_name = ?, contact_name = ?, email = ?, phone = ?, stage = ?, value = ?, source = ?, next_follow_up = ? "
                        + "WHERE tenant_id = ? AND id = ?",
                request.companyName().trim(),
                request.contactName().trim(),
                request.email().trim().toLowerCase(Locale.ROOT),
                normalizeOptional(request.phone()),
                normalizeStage(request.stage()),
                request.value(),
                request.source().trim(),
                request.nextFollowUp() == null ? null : Date.valueOf(request.nextFollowUp()),
                principal.tenantId(),
                leadId);
        if (updated != 1) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Lead not found for tenant");
        }
        return getLead(principal.tenantId(), leadId);
    }

    @Transactional
    public void deleteLead(JwtPrincipal principal, Long leadId) {
        jdbcTemplate.update("DELETE FROM crm_activities WHERE tenant_id = ? AND lead_id = ?", principal.tenantId(), leadId);
        int deleted = jdbcTemplate.update("DELETE FROM crm_leads WHERE tenant_id = ? AND id = ?", principal.tenantId(), leadId);
        if (deleted != 1) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Lead not found for tenant");
        }
    }

    @Transactional
    public LeadResponse moveStage(JwtPrincipal principal, Long leadId, StageRequest request) {
        int updated = jdbcTemplate.update(
                "UPDATE crm_leads SET stage = ? WHERE tenant_id = ? AND id = ?",
                normalizeStage(request.stage()),
                principal.tenantId(),
                leadId);
        if (updated != 1) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Lead not found for tenant");
        }
        return getLead(principal.tenantId(), leadId);
    }

    @Transactional
    public ActivityResponse queueEmailAutomation(JwtPrincipal principal, Long leadId, EmailAutomationRequest request) {
        getLead(principal.tenantId(), leadId);
        jdbcTemplate.update(
                "INSERT INTO crm_activities (tenant_id, lead_id, activity_type, body, n8n_workflow_id, status) "
                        + "VALUES (?, ?, 'EMAIL', ?, ?, 'OPEN')",
                principal.tenantId(),
                leadId,
                request.body().trim(),
                normalizeOptional(request.n8nWorkflowId()));
        Long id = jdbcTemplate.queryForObject(
                "SELECT id FROM crm_activities WHERE tenant_id = ? AND lead_id = ? ORDER BY id DESC LIMIT 1",
                Long.class,
                principal.tenantId(),
                leadId);
        return new ActivityResponse(id, leadId, "EMAIL", request.body().trim(), "OPEN");
    }

    private LeadResponse getLead(Long tenantId, Long leadId) {
        try {
            return jdbcTemplate.queryForObject(
                    "SELECT id, tenant_id, company_name, contact_name, email, phone, stage, value, source, next_follow_up, created_at "
                            + "FROM crm_leads WHERE tenant_id = ? AND id = ?",
                    this::mapLead,
                    tenantId,
                    leadId);
        } catch (RuntimeException ex) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Lead not found for tenant");
        }
    }

    private LeadResponse mapLead(ResultSet rs, int rowNum) throws SQLException {
        Date followUp = rs.getDate("next_follow_up");
        return new LeadResponse(
                rs.getLong("id"),
                rs.getLong("tenant_id"),
                rs.getString("company_name"),
                rs.getString("contact_name"),
                rs.getString("email"),
                rs.getString("phone"),
                rs.getString("stage"),
                rs.getBigDecimal("value"),
                rs.getString("source"),
                followUp == null ? null : followUp.toLocalDate(),
                rs.getTimestamp("created_at").toInstant());
    }

    private String normalizeStage(String stage) {
        String normalized = stage.trim().toUpperCase(Locale.ROOT);
        if (!List.of("NEW", "CONTACTED", "DEMO", "PROPOSAL", "WON", "LOST").contains(normalized)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid lead stage");
        }
        return normalized;
    }

    private String normalizeOptional(String value) {
        return StringUtils.hasText(value) ? value.trim() : null;
    }

    public record LeadRequest(
            @NotBlank @Size(max = 180) String companyName,
            @NotBlank @Size(max = 160) String contactName,
            @NotBlank @Email @Size(max = 255) String email,
            @Size(max = 20) String phone,
            @NotBlank @Pattern(regexp = "^(NEW|CONTACTED|DEMO|PROPOSAL|WON|LOST)$") String stage,
            @DecimalMin("0.00") BigDecimal value,
            @NotBlank @Size(max = 120) String source,
            LocalDate nextFollowUp) {
    }

    public record StageRequest(@NotBlank @Pattern(regexp = "^(NEW|CONTACTED|DEMO|PROPOSAL|WON|LOST)$") String stage) {
    }

    public record EmailAutomationRequest(
            @NotBlank @Size(max = 4000) String body,
            @Size(max = 255) String n8nWorkflowId) {
    }

    public record LeadResponse(
            Long id,
            Long tenantId,
            String companyName,
            String contactName,
            String email,
            String phone,
            String stage,
            BigDecimal value,
            String source,
            LocalDate nextFollowUp,
            java.time.Instant createdAt) {
    }

    public record ActivityResponse(Long id, Long leadId, String activityType, String body, String status) {
    }
}
