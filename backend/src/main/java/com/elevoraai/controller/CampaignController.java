package com.elevoraai.controller;

import com.elevoraai.config.SecurityConfig.JwtPrincipal;
import com.elevoraai.service.CampaignService;
import com.elevoraai.service.CampaignService.CampaignRequest;
import com.elevoraai.service.CampaignService.CampaignResponse;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
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
@RequestMapping("/api/admin/campaigns")
@PreAuthorize("hasRole('ADMIN')")
public class CampaignController {

    private final CampaignService campaignService;

    public CampaignController(CampaignService campaignService) {
        this.campaignService = campaignService;
    }

    @GetMapping
    public List<CampaignResponse> listCampaigns(@AuthenticationPrincipal JwtPrincipal principal) {
        return campaignService.listCampaigns(principal);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public CampaignResponse createCampaign(
            @AuthenticationPrincipal JwtPrincipal principal,
            @Valid @RequestBody CampaignRequest request) {
        return campaignService.createCampaign(principal, request);
    }

    @PutMapping("/{id}")
    public CampaignResponse updateCampaign(
            @AuthenticationPrincipal JwtPrincipal principal,
            @PathVariable Long id,
            @Valid @RequestBody CampaignRequest request) {
        return campaignService.updateCampaign(principal, id, request);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deleteCampaign(
            @AuthenticationPrincipal JwtPrincipal principal,
            @PathVariable Long id) {
        campaignService.deleteCampaign(principal, id);
    }

    @PutMapping("/{id}/status")
    public CampaignResponse updateStatus(
            @AuthenticationPrincipal JwtPrincipal principal,
            @PathVariable Long id,
            @RequestBody @NotBlank @Pattern(regexp = "^(ACTIVE|PAUSED|COMPLETED|ARCHIVED)$") String status) {
        return campaignService.updateStatus(principal, id, status);
    }
}
