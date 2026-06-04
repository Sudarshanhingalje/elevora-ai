package com.elevoraai.controller;

import com.elevoraai.config.SecurityConfig.JwtPrincipal;
import com.elevoraai.service.CrmAiService;
import com.elevoraai.service.CrmAiService.ActivityResponse;
import com.elevoraai.service.CrmAiService.EmailAutomationRequest;
import com.elevoraai.service.CrmAiService.LeadRequest;
import com.elevoraai.service.CrmAiService.LeadResponse;
import com.elevoraai.service.CrmAiService.StageRequest;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Pattern;
import java.util.List;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@Validated
@RestController
@RequestMapping("/api/crm-ai")
public class CrmAiController {

    private final CrmAiService crmAiService;

    public CrmAiController(CrmAiService crmAiService) {
        this.crmAiService = crmAiService;
    }

    @GetMapping("/leads")
    public List<LeadResponse> listLeads(
            @AuthenticationPrincipal JwtPrincipal principal,
            @RequestParam(required = false) @Pattern(regexp = "^(NEW|CONTACTED|DEMO|PROPOSAL|WON|LOST)$") String stage) {
        return crmAiService.listLeads(principal, stage);
    }

    @PostMapping("/leads")
    public LeadResponse createLead(
            @AuthenticationPrincipal JwtPrincipal principal,
            @Valid @RequestBody LeadRequest request) {
        return crmAiService.createLead(principal, request);
    }

    @PutMapping("/leads/{leadId}")
    public LeadResponse updateLead(
            @AuthenticationPrincipal JwtPrincipal principal,
            @PathVariable Long leadId,
            @Valid @RequestBody LeadRequest request) {
        return crmAiService.updateLead(principal, leadId, request);
    }

    @DeleteMapping("/leads/{leadId}")
    public void deleteLead(
            @AuthenticationPrincipal JwtPrincipal principal,
            @PathVariable Long leadId) {
        crmAiService.deleteLead(principal, leadId);
    }

    @PatchMapping("/leads/{leadId}/stage")
    public LeadResponse moveStage(
            @AuthenticationPrincipal JwtPrincipal principal,
            @PathVariable Long leadId,
            @Valid @RequestBody StageRequest request) {
        return crmAiService.moveStage(principal, leadId, request);
    }

    @PostMapping("/leads/{leadId}/email-automation")
    public ActivityResponse queueEmailAutomation(
            @AuthenticationPrincipal JwtPrincipal principal,
            @PathVariable Long leadId,
            @Valid @RequestBody EmailAutomationRequest request) {
        return crmAiService.queueEmailAutomation(principal, leadId, request);
    }
}
