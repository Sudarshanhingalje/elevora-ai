package com.elevoraai.service;

import com.elevoraai.config.SecurityConfig.JwtPrincipal;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;
import org.springframework.web.client.RestClient;
import org.springframework.web.server.ResponseStatusException;

@Service
public class AutomationService {

    private final JdbcTemplate jdbcTemplate;
    private final ObjectMapper objectMapper;
    private final RestClient restClient;
    private final String n8nWebhookBaseUrl;
    private final String whatsappPhoneNumberId;
    private final String whatsappAccessToken;
    private final String whatsappGraphBaseUrl;

    public AutomationService(
            JdbcTemplate jdbcTemplate,
            ObjectMapper objectMapper,
            @Value("${app.n8n.webhook-base-url:http://localhost:5678/webhook}") String n8nWebhookBaseUrl,
            @Value("${app.whatsapp.business-phone-number-id:}") String whatsappPhoneNumberId,
            @Value("${app.whatsapp.access-token:}") String whatsappAccessToken,
            @Value("${app.whatsapp.graph-base-url:https://graph.facebook.com/v20.0}") String whatsappGraphBaseUrl) {
        this.jdbcTemplate = jdbcTemplate;
        this.objectMapper = objectMapper;
        this.restClient = RestClient.create();
        this.n8nWebhookBaseUrl = n8nWebhookBaseUrl;
        this.whatsappPhoneNumberId = whatsappPhoneNumberId;
        this.whatsappAccessToken = whatsappAccessToken;
        this.whatsappGraphBaseUrl = whatsappGraphBaseUrl;
    }

    public List<WorkflowResponse> listWorkflows(JwtPrincipal principal) {
        seedDefaultWorkflows(principal.tenantId());
        return jdbcTemplate.query(
                "SELECT id, tenant_id, name, workflow_type, n8n_webhook_url, status, last_run_at, created_at "
                        + "FROM automation_workflows WHERE tenant_id = ? ORDER BY id ASC",
                this::mapWorkflow,
                principal.tenantId());
    }

    @Transactional
    public WorkflowResponse upsertWorkflow(JwtPrincipal principal, WorkflowRequest request) {
        String type = normalizeWorkflowType(request.workflowType());
        int updated = jdbcTemplate.update(
                "UPDATE automation_workflows SET name = ?, n8n_webhook_url = ?, status = ? "
                        + "WHERE tenant_id = ? AND workflow_type = ?",
                request.name().trim(),
                request.n8nWebhookUrl().trim(),
                normalizeWorkflowStatus(request.status()),
                principal.tenantId(),
                type);
        if (updated == 0) {
            jdbcTemplate.update(
                    "INSERT INTO automation_workflows (tenant_id, name, workflow_type, n8n_webhook_url, status) VALUES (?, ?, ?, ?, ?)",
                    principal.tenantId(),
                    request.name().trim(),
                    type,
                    request.n8nWebhookUrl().trim(),
                    normalizeWorkflowStatus(request.status()));
        }
        return getWorkflowByType(principal.tenantId(), type);
    }

    @Transactional
    public AutomationEventResponse triggerWorkflow(JwtPrincipal principal, TriggerRequest request) {
        WorkflowResponse workflow = getWorkflowByType(principal.tenantId(), normalizeWorkflowType(request.workflowType()));
        String payloadJson = writeJson(Map.of(
                "tenantId", principal.tenantId(),
                "entityType", request.entityType(),
                "entityId", request.entityId(),
                "payload", request.payload()));
        jdbcTemplate.update(
                "INSERT INTO automation_events (tenant_id, workflow_id, entity_type, entity_id, payload, status) VALUES (?, ?, ?, ?, CAST(? AS JSON), 'QUEUED')",
                principal.tenantId(),
                workflow.id(),
                request.entityType().trim(),
                request.entityId(),
                payloadJson);
        Long eventId = jdbcTemplate.queryForObject(
                "SELECT id FROM automation_events WHERE tenant_id = ? ORDER BY id DESC LIMIT 1",
                Long.class,
                principal.tenantId());
        try {
            restClient.post()
                    .uri(workflow.n8nWebhookUrl())
                    .body(Map.of("eventId", eventId, "tenantId", principal.tenantId(), "payload", request.payload()))
                    .retrieve()
                    .toBodilessEntity();
            jdbcTemplate.update(
                    "UPDATE automation_events SET status = 'SENT', sent_at = CURRENT_TIMESTAMP WHERE tenant_id = ? AND id = ?",
                    principal.tenantId(),
                    eventId);
            jdbcTemplate.update(
                    "UPDATE automation_workflows SET last_run_at = CURRENT_TIMESTAMP WHERE tenant_id = ? AND id = ?",
                    principal.tenantId(),
                    workflow.id());
        } catch (RuntimeException ex) {
            jdbcTemplate.update(
                    "UPDATE automation_events SET status = 'FAILED', error_message = ? WHERE tenant_id = ? AND id = ?",
                    limit(ex.getMessage(), 500),
                    principal.tenantId(),
                    eventId);
        }
        return getEvent(principal.tenantId(), eventId);
    }

    public WhatsAppResponse sendWhatsApp(JwtPrincipal principal, WhatsAppRequest request) {
        if (!StringUtils.hasText(whatsappPhoneNumberId) || !StringUtils.hasText(whatsappAccessToken)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "WhatsApp credentials are not configured");
        }
        restClient.post()
                .uri(whatsappGraphBaseUrl.replaceAll("/$", "") + "/" + whatsappPhoneNumberId + "/messages")
                .header(HttpHeaders.AUTHORIZATION, "Bearer " + whatsappAccessToken)
                .body(Map.of(
                        "messaging_product", "whatsapp",
                        "to", request.toPhone(),
                        "type", "text",
                        "text", Map.of("preview_url", false, "body", request.message())))
                .retrieve()
                .toBodilessEntity();
        return new WhatsAppResponse(principal.tenantId(), request.toPhone(), "SENT");
    }

    private void seedDefaultWorkflows(Long tenantId) {
        Integer count = jdbcTemplate.queryForObject(
                "SELECT COUNT(*) FROM automation_workflows WHERE tenant_id = ?",
                Integer.class,
                tenantId);
        if (count != null && count > 0) {
            return;
        }
        jdbcTemplate.update(
                "INSERT INTO automation_workflows (tenant_id, name, workflow_type, n8n_webhook_url, status) VALUES "
                        + "(?, 'WhatsApp membership reminders', 'WHATSAPP_REMINDER', ?, 'ACTIVE'), "
                        + "(?, 'CRM email follow-up', 'EMAIL_FOLLOWUP', ?, 'ACTIVE'), "
                        + "(?, 'CRM sync workflow', 'CRM_SYNC', ?, 'ACTIVE')",
                tenantId,
                n8nWebhookBaseUrl.replaceAll("/$", "") + "/elevora-whatsapp-reminder",
                tenantId,
                n8nWebhookBaseUrl.replaceAll("/$", "") + "/elevora-crm-email",
                tenantId,
                n8nWebhookBaseUrl.replaceAll("/$", "") + "/elevora-crm-sync");
    }

    private WorkflowResponse getWorkflowByType(Long tenantId, String type) {
        try {
            return jdbcTemplate.queryForObject(
                    "SELECT id, tenant_id, name, workflow_type, n8n_webhook_url, status, last_run_at, created_at "
                            + "FROM automation_workflows WHERE tenant_id = ? AND workflow_type = ?",
                    this::mapWorkflow,
                    tenantId,
                    type);
        } catch (RuntimeException ex) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Automation workflow not found for tenant");
        }
    }

    private AutomationEventResponse getEvent(Long tenantId, Long eventId) {
        return jdbcTemplate.queryForObject(
                "SELECT id, tenant_id, workflow_id, entity_type, entity_id, status, error_message, created_at, sent_at "
                        + "FROM automation_events WHERE tenant_id = ? AND id = ?",
                this::mapEvent,
                tenantId,
                eventId);
    }

    private WorkflowResponse mapWorkflow(ResultSet rs, int rowNum) throws SQLException {
        return new WorkflowResponse(
                rs.getLong("id"),
                rs.getLong("tenant_id"),
                rs.getString("name"),
                rs.getString("workflow_type"),
                rs.getString("n8n_webhook_url"),
                rs.getString("status"),
                rs.getTimestamp("last_run_at") == null ? null : rs.getTimestamp("last_run_at").toInstant(),
                rs.getTimestamp("created_at").toInstant());
    }

    private AutomationEventResponse mapEvent(ResultSet rs, int rowNum) throws SQLException {
        return new AutomationEventResponse(
                rs.getLong("id"),
                rs.getLong("tenant_id"),
                rs.getLong("workflow_id"),
                rs.getString("entity_type"),
                rs.getLong("entity_id"),
                rs.getString("status"),
                rs.getString("error_message"),
                rs.getTimestamp("created_at").toInstant(),
                rs.getTimestamp("sent_at") == null ? null : rs.getTimestamp("sent_at").toInstant());
    }

    private String writeJson(Object value) {
        try {
            return objectMapper.writeValueAsString(value);
        } catch (JsonProcessingException ex) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid automation payload");
        }
    }

    private String normalizeWorkflowType(String value) {
        String normalized = value.trim().toUpperCase(Locale.ROOT);
        if (!List.of("WHATSAPP_REMINDER", "EMAIL_FOLLOWUP", "CRM_SYNC").contains(normalized)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid workflow type");
        }
        return normalized;
    }

    private String normalizeWorkflowStatus(String value) {
        String normalized = value.trim().toUpperCase(Locale.ROOT);
        if (!List.of("ACTIVE", "PAUSED", "FAILED").contains(normalized)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid workflow status");
        }
        return normalized;
    }

    private String limit(String value, int max) {
        if (!StringUtils.hasText(value)) {
            return "Automation failed";
        }
        return value.length() <= max ? value : value.substring(0, max);
    }

    public record WorkflowRequest(
            @NotBlank @Size(max = 160) String name,
            @NotBlank @Pattern(regexp = "^(WHATSAPP_REMINDER|EMAIL_FOLLOWUP|CRM_SYNC)$") String workflowType,
            @NotBlank @Size(max = 500) String n8nWebhookUrl,
            @NotBlank @Pattern(regexp = "^(ACTIVE|PAUSED|FAILED)$") String status) {
    }

    public record TriggerRequest(
            @NotBlank @Pattern(regexp = "^(WHATSAPP_REMINDER|EMAIL_FOLLOWUP|CRM_SYNC)$") String workflowType,
            @NotBlank @Size(max = 80) String entityType,
            Long entityId,
            Map<String, Object> payload) {
    }

    public record WhatsAppRequest(
            @NotBlank @Pattern(regexp = "^[1-9][0-9]{9,14}$") String toPhone,
            @NotBlank @Size(max = 1000) String message) {
    }

    public record WorkflowResponse(
            Long id,
            Long tenantId,
            String name,
            String workflowType,
            String n8nWebhookUrl,
            String status,
            java.time.Instant lastRunAt,
            java.time.Instant createdAt) {
    }

    public record AutomationEventResponse(
            Long id,
            Long tenantId,
            Long workflowId,
            String entityType,
            Long entityId,
            String status,
            String errorMessage,
            java.time.Instant createdAt,
            java.time.Instant sentAt) {
    }

    public record WhatsAppResponse(Long tenantId, String toPhone, String status) {
    }
}
