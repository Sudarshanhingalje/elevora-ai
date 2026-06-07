package com.elevoraai.controller;

import com.elevoraai.config.SecurityConfig.JwtPrincipal;
import com.elevoraai.service.EmailCampaignRecipientsService;
import com.elevoraai.service.EmailCampaignRecipientsService.BulkAddRequest;
import com.elevoraai.service.EmailCampaignRecipientsService.RecipientResponse;
import com.elevoraai.service.EmailCampaignRecipientsService.RecipientStats;
import com.elevoraai.service.EmailDripEngineService;
import jakarta.validation.Valid;
import java.util.List;
import java.util.Map;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;

@Validated
@RestController
@RequestMapping("/api/admin/email-campaigns/{campaignId}/recipients")
@PreAuthorize("hasRole('ADMIN')")
public class EmailCampaignRecipientsController {

    private final EmailCampaignRecipientsService recipientsService;
    private final EmailDripEngineService         dripEngine;

    public EmailCampaignRecipientsController(
            EmailCampaignRecipientsService recipientsService,
            EmailDripEngineService dripEngine) {
        this.recipientsService = recipientsService;
        this.dripEngine        = dripEngine;
    }

    /** List all recipients for a campaign */
    @GetMapping
    public List<RecipientResponse> list(
            @AuthenticationPrincipal JwtPrincipal principal,
            @PathVariable Long campaignId) {
        return recipientsService.listRecipients(principal, campaignId);
    }

    /** Get recipient counts */
    @GetMapping("/stats")
    public RecipientStats stats(
            @AuthenticationPrincipal JwtPrincipal principal,
            @PathVariable Long campaignId) {
        // Assert ownership first
        recipientsService.listRecipients(principal, campaignId); // throws 404 if not owner
        return recipientsService.getStats(campaignId);
    }

    /** Bulk-add recipients */
    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public Map<String, Object> addRecipients(
            @AuthenticationPrincipal JwtPrincipal principal,
            @PathVariable Long campaignId,
            @Valid @RequestBody BulkAddRequest request) {
        int added = recipientsService.addRecipients(principal, campaignId, request.recipients());
        return Map.of("added", added, "message", added + " recipient(s) added successfully.");
    }

    /** Remove a single recipient */
    @DeleteMapping("/{recipientId}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void remove(
            @AuthenticationPrincipal JwtPrincipal principal,
            @PathVariable Long campaignId,
            @PathVariable Long recipientId) {
        recipientsService.removeRecipient(principal, campaignId, recipientId);
    }

    /** Reset all FAILED recipients back to QUEUED */
    @PostMapping("/reset-failed")
    public Map<String, Object> resetFailed(
            @AuthenticationPrincipal JwtPrincipal principal,
            @PathVariable Long campaignId) {
        int reset = recipientsService.resetFailed(principal, campaignId);
        return Map.of("reset", reset, "message", reset + " failed recipient(s) reset to QUEUED.");
    }

    /** START drip sending */
    @PostMapping("/start-drip")
    public Map<String, Object> startDrip(
            @AuthenticationPrincipal JwtPrincipal principal,
            @PathVariable Long campaignId) {
        if (dripEngine.isRunning(campaignId)) {
            return Map.of("status", "ALREADY_RUNNING",
                    "message", "Drip send is already in progress for this campaign.");
        }
        // Verify ownership
        RecipientStats stats = recipientsService.getStats(campaignId);
        if (stats.queued() == 0) {
            return Map.of("status", "NO_RECIPIENTS",
                    "message", "No QUEUED recipients found. Please add recipients first.");
        }
        // Fire async — returns immediately
        dripEngine.startDrip(campaignId, principal.tenantId());
        return Map.of(
                "status", "STARTED",
                "message", "Drip campaign started! Sending up to 100 emails (1 every 1–2 min, 4-min pause every 10).",
                "queued", stats.queued());
    }

    /** STOP drip sending */
    @PostMapping("/stop-drip")
    public Map<String, Object> stopDrip(
            @AuthenticationPrincipal JwtPrincipal principal,
            @PathVariable Long campaignId) {
        dripEngine.stopRun(campaignId);
        return Map.of("status", "STOP_REQUESTED",
                "message", "Stop signal sent. The current email will finish, then sending will halt.");
    }

    /** Live status check */
    @GetMapping("/drip-status")
    public Map<String, Object> dripStatus(
            @AuthenticationPrincipal JwtPrincipal principal,
            @PathVariable Long campaignId) {
        boolean running = dripEngine.isRunning(campaignId);
        RecipientStats stats = recipientsService.getStats(campaignId);
        return Map.of(
                "running", running,
                "queued",  stats.queued(),
                "sent",    stats.sent(),
                "failed",  stats.failed(),
                "total",   stats.total());
    }
}
