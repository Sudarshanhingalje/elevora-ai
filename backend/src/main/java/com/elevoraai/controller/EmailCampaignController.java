package com.elevoraai.controller;

import com.elevoraai.config.SecurityConfig.JwtPrincipal;
import com.elevoraai.service.EmailCampaignService;
import com.elevoraai.service.EmailCampaignService.EmailCampaignRequest;
import com.elevoraai.service.EmailCampaignService.EmailCampaignResponse;
import jakarta.validation.Valid;
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@Validated
@RestController
@RequestMapping("/api/admin/email-campaigns")
@PreAuthorize("hasRole('ADMIN')")
public class EmailCampaignController {

    private final EmailCampaignService emailCampaignService;

    public EmailCampaignController(EmailCampaignService emailCampaignService) {
        this.emailCampaignService = emailCampaignService;
    }

    @GetMapping
    public List<EmailCampaignResponse> list(@AuthenticationPrincipal JwtPrincipal principal) {
        return emailCampaignService.listCampaigns(principal);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public EmailCampaignResponse create(
            @AuthenticationPrincipal JwtPrincipal principal,
            @Valid @RequestBody EmailCampaignRequest request) {
        return emailCampaignService.createCampaign(principal, request);
    }

    @PutMapping("/{id}")
    public EmailCampaignResponse update(
            @AuthenticationPrincipal JwtPrincipal principal,
            @PathVariable Long id,
            @Valid @RequestBody EmailCampaignRequest request) {
        return emailCampaignService.updateCampaign(principal, id, request);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(
            @AuthenticationPrincipal JwtPrincipal principal,
            @PathVariable Long id) {
        emailCampaignService.deleteCampaign(principal, id);
    }

    @PostMapping("/{id}/send")
    public EmailCampaignResponse markSent(
            @AuthenticationPrincipal JwtPrincipal principal,
            @PathVariable Long id,
            @RequestParam(defaultValue = "0") int sentCount) {
        return emailCampaignService.markSent(principal, id, sentCount);
    }
}
