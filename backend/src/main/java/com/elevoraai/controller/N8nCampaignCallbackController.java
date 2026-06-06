package com.elevoraai.controller;

import com.elevoraai.service.CampaignPostService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

/**
 * Internal callback endpoint that n8n hits after completing (or failing)
 * image generation + social media posting for a campaign post.
 *
 * Authentication: shared secret in X-Callback-Secret header.
 * No JWT session required — this endpoint is called by n8n, not the browser.
 */
@RestController
@RequestMapping("/api/internal/campaign-posts")
public class N8nCampaignCallbackController {

    private static final Logger log = LoggerFactory.getLogger(N8nCampaignCallbackController.class);

    private final CampaignPostService campaignPostService;
    private final String callbackSecret;

    public N8nCampaignCallbackController(
            CampaignPostService campaignPostService,
            @Value("${app.n8n.campaign-webhook-secret:elevora-n8n-secret-change-me}") String callbackSecret) {
        this.campaignPostService = campaignPostService;
        this.callbackSecret = callbackSecret;
    }

    public record CallbackRequest(
            String status,           // POSTED | FAILED
            String generatedImageUrl, // MinIO public URL (nullable)
            String errorMessage      // optional error detail on FAILED
    ) {}

    public record CallbackResponse(String message) {}

    /**
     * POST /api/internal/campaign-posts/{id}/callback
     *
     * Called by n8n after publishing is done.
     * Header:  X-Callback-Secret: <shared secret>
     * Body:    { "status": "POSTED", "generatedImageUrl": "https://..." }
     *   OR:    { "status": "FAILED", "errorMessage": "reason..." }
     */
    @PostMapping("/{id}/callback")
    public CallbackResponse handleCallback(
            @PathVariable Long id,
            @RequestHeader(value = "X-Callback-Secret", required = false) String secret,
            @RequestBody CallbackRequest body) {

        // Validate secret
        if (!callbackSecret.equals(secret)) {
            log.warn("Invalid callback secret for post id={}", id);
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Invalid callback secret");
        }

        String newStatus = body.status();
        if (!"POSTED".equalsIgnoreCase(newStatus) && !"FAILED".equalsIgnoreCase(newStatus)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "Invalid status. Must be POSTED or FAILED");
        }

        campaignPostService.updatePostStatus(id, newStatus.toUpperCase(), body.generatedImageUrl());

        if ("FAILED".equalsIgnoreCase(newStatus)) {
            log.error("Campaign post id={} FAILED: {}", id, body.errorMessage());
        } else {
            log.info("Campaign post id={} successfully POSTED. Image: {}", id, body.generatedImageUrl());
        }

        return new CallbackResponse("Campaign post id=" + id + " updated to " + newStatus.toUpperCase());
    }
}
