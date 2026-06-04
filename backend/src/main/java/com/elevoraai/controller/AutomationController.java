package com.elevoraai.controller;

import com.elevoraai.config.SecurityConfig.JwtPrincipal;
import com.elevoraai.service.AutomationService;
import com.elevoraai.service.AutomationService.AutomationEventResponse;
import com.elevoraai.service.AutomationService.TriggerRequest;
import com.elevoraai.service.AutomationService.WhatsAppRequest;
import com.elevoraai.service.AutomationService.WhatsAppResponse;
import com.elevoraai.service.AutomationService.WorkflowRequest;
import com.elevoraai.service.AutomationService.WorkflowResponse;
import jakarta.validation.Valid;
import java.util.List;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/automation")
public class AutomationController {

    private final AutomationService automationService;

    public AutomationController(AutomationService automationService) {
        this.automationService = automationService;
    }

    @GetMapping("/workflows")
    public List<WorkflowResponse> listWorkflows(@AuthenticationPrincipal JwtPrincipal principal) {
        return automationService.listWorkflows(principal);
    }

    @PutMapping("/workflows")
    public WorkflowResponse upsertWorkflow(
            @AuthenticationPrincipal JwtPrincipal principal,
            @Valid @RequestBody WorkflowRequest request) {
        return automationService.upsertWorkflow(principal, request);
    }

    @PostMapping("/trigger")
    public AutomationEventResponse triggerWorkflow(
            @AuthenticationPrincipal JwtPrincipal principal,
            @Valid @RequestBody TriggerRequest request) {
        return automationService.triggerWorkflow(principal, request);
    }

    @PostMapping("/whatsapp/send")
    public WhatsAppResponse sendWhatsApp(
            @AuthenticationPrincipal JwtPrincipal principal,
            @Valid @RequestBody WhatsAppRequest request) {
        return automationService.sendWhatsApp(principal, request);
    }
}
