package com.elevoraai.controller;

import com.elevoraai.config.SecurityConfig.JwtPrincipal;
import com.elevoraai.service.RagChatService;
import com.elevoraai.service.RagChatService.RagChatRequest;
import com.elevoraai.service.RagChatService.RagChatResponse;
import jakarta.validation.Valid;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/rag/chat")
public class RagChatController {

    private final RagChatService ragChatService;

    public RagChatController(RagChatService ragChatService) {
        this.ragChatService = ragChatService;
    }

    @PostMapping
    public RagChatResponse ask(
            @AuthenticationPrincipal JwtPrincipal principal,
            @Valid @RequestBody RagChatRequest request) {
        return ragChatService.ask(principal, request);
    }
}
