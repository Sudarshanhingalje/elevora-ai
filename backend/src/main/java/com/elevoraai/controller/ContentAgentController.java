package com.elevoraai.controller;

import com.elevoraai.config.SecurityConfig.JwtPrincipal;
import com.elevoraai.service.ContentAgentService;
import com.elevoraai.service.ContentAgentService.ContentDraftRequest;
import com.elevoraai.service.ContentAgentService.ContentPostResponse;
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
@RequestMapping("/api/agents/content")
public class ContentAgentController {

    private final ContentAgentService contentAgentService;

    public ContentAgentController(ContentAgentService contentAgentService) {
        this.contentAgentService = contentAgentService;
    }

    @GetMapping("/posts")
    public List<ContentPostResponse> listPosts(@AuthenticationPrincipal JwtPrincipal principal) {
        return contentAgentService.listPosts(principal);
    }

    @PostMapping("/posts")
    public ContentPostResponse generateDraft(
            @AuthenticationPrincipal JwtPrincipal principal,
            @Valid @RequestBody ContentDraftRequest request) {
        return contentAgentService.generateDraft(principal, request);
    }

    @PatchMapping("/posts/{postId}/publish")
    public ContentPostResponse markPublished(
            @AuthenticationPrincipal JwtPrincipal principal,
            @PathVariable Long postId) {
        return contentAgentService.markPublished(principal, postId);
    }
}
