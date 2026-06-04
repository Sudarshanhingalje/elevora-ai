package com.elevoraai.controller;

import com.elevoraai.config.SecurityConfig.JwtPrincipal;
import com.elevoraai.service.SocialMediaAgentService;
import com.elevoraai.service.SocialMediaAgentService.SocialPostRequest;
import com.elevoraai.service.SocialMediaAgentService.SocialPostResponse;
import jakarta.validation.Valid;
import java.util.List;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/agents/social-media")
public class SocialMediaAgentController {

    private final SocialMediaAgentService socialMediaAgentService;

    public SocialMediaAgentController(SocialMediaAgentService socialMediaAgentService) {
        this.socialMediaAgentService = socialMediaAgentService;
    }

    @GetMapping("/posts")
    public List<SocialPostResponse> listPosts(@AuthenticationPrincipal JwtPrincipal principal) {
        return socialMediaAgentService.listPosts(principal);
    }

    @PostMapping("/posts")
    public SocialPostResponse generatePost(
            @AuthenticationPrincipal JwtPrincipal principal,
            @Valid @RequestBody SocialPostRequest request) {
        return socialMediaAgentService.generatePost(principal, request);
    }

    @PatchMapping("/posts/{postId}/publish")
    public SocialPostResponse markPublished(
            @AuthenticationPrincipal JwtPrincipal principal,
            @PathVariable Long postId) {
        return socialMediaAgentService.markPublished(principal, postId);
    }
}
