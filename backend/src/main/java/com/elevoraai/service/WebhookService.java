package com.elevoraai.service;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.sql.Timestamp;
import java.util.Map;
import org.springframework.http.HttpStatus;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

@Service
public class WebhookService {

    private final JdbcTemplate jdbcTemplate;
    private final ObjectMapper objectMapper;

    public WebhookService(JdbcTemplate jdbcTemplate, ObjectMapper objectMapper) {
        this.jdbcTemplate = jdbcTemplate;
        this.objectMapper = objectMapper;
    }

    public void processWebhook(Long tenantId, String provider, String eventType, String payloadJson) {
        // Parse and log incoming webhook to billing_events or general logs
        try {
            jdbcTemplate.update(
                    "INSERT INTO billing_events (tenant_id, event_type, provider, provider_event_id, status, payload_json) "
                            + "VALUES (?, ?, ?, ?, 'RECEIVED', CAST(? AS JSON))",
                    tenantId,
                    eventType,
                    provider.toUpperCase(),
                    "web_" + System.currentTimeMillis(),
                    payloadJson);
        } catch (Exception ex) {
            // General insert for non-billing events
            jdbcTemplate.update(
                    "INSERT INTO usage_metrics (tenant_id, metric_name, metric_value) VALUES (?, ?, ?)",
                    tenantId,
                    "webhook_" + provider.toLowerCase() + "_" + eventType.toLowerCase(),
                    1.00);
        }
    }

    public String serializePayload(Map<String, Object> payload) {
        try {
            return objectMapper.writeValueAsString(payload);
        } catch (JsonProcessingException e) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid webhook payload json", e);
        }
    }
}
