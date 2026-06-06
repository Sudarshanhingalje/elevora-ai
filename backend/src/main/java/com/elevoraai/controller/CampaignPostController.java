package com.elevoraai.controller;

import com.elevoraai.config.SecurityConfig.JwtPrincipal;
import com.elevoraai.service.CampaignPostService;
import com.elevoraai.service.CampaignPostService.CampaignPostRequest;
import com.elevoraai.service.CampaignPostService.CampaignPostResponse;
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
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@Validated
@RestController
@RequestMapping("/api/admin/campaign-posts")
@PreAuthorize("hasRole('ADMIN')")
public class CampaignPostController {

    private final CampaignPostService campaignPostService;

    public CampaignPostController(CampaignPostService campaignPostService) {
        this.campaignPostService = campaignPostService;
    }

    @GetMapping
    public List<CampaignPostResponse> listCampaignPosts(@AuthenticationPrincipal JwtPrincipal principal) {
        return campaignPostService.listCampaignPosts(principal);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public CampaignPostResponse createCampaignPost(
            @AuthenticationPrincipal JwtPrincipal principal,
            @Valid @RequestBody CampaignPostRequest request) {
        return campaignPostService.createCampaignPost(principal, request);
    }

    @PutMapping("/{id}")
    public CampaignPostResponse updateCampaignPost(
            @AuthenticationPrincipal JwtPrincipal principal,
            @PathVariable Long id,
            @Valid @RequestBody CampaignPostRequest request) {
        return campaignPostService.updateCampaignPost(principal, id, request);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deleteCampaignPost(
            @AuthenticationPrincipal JwtPrincipal principal,
            @PathVariable Long id) {
        campaignPostService.deleteCampaignPost(principal, id);
    }
}
