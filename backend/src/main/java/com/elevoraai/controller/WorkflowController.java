package com.elevoraai.controller;

import com.elevoraai.config.SecurityConfig.JwtPrincipal;
import com.elevoraai.service.AutomationService;
import com.elevoraai.service.AutomationService.WorkflowRequest;
import com.elevoraai.service.AutomationService.WorkflowResponse;
import com.elevoraai.service.WebhookService;
import jakarta.validation.Valid;
import java.util.List;
import java.util.Map;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/workflows")
public class WorkflowController {

    private final AutomationService automationService;
    private final WebhookService webhookService;

    public WorkflowController(AutomationService automationService, WebhookService webhookService) {
        this.automationService = automationService;
        this.webhookService = webhookService;
    }

    @GetMapping
    public List<WorkflowResponse> listWorkflows(@AuthenticationPrincipal JwtPrincipal principal) {
        return automationService.listWorkflows(principal);
    }

    @PutMapping
    public WorkflowResponse upsertWorkflow(
            @AuthenticationPrincipal JwtPrincipal principal,
            @Valid @RequestBody WorkflowRequest request) {
        return automationService.upsertWorkflow(principal, request);
    }

    @PostMapping("/webhook-receiver")
    @ResponseStatus(HttpStatus.ACCEPTED)
    public void receiveWebhook(
            @AuthenticationPrincipal JwtPrincipal principal,
            @RequestParam String provider,
            @RequestParam String eventType,
            @RequestBody Map<String, Object> body) {
        String payloadJson = webhookService.serializePayload(body);
        webhookService.processWebhook(principal.tenantId(), provider, eventType, payloadJson);
    }
}
