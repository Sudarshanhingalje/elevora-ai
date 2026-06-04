package com.elevoraai.controller;

import com.elevoraai.config.SecurityConfig.JwtPrincipal;
import com.elevoraai.service.RagPipelineService;
import com.elevoraai.service.RagPipelineService.KnowledgeDocumentRequest;
import com.elevoraai.service.RagPipelineService.KnowledgeDocumentResponse;
import jakarta.validation.Valid;
import java.util.List;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/rag")
public class RagController {

    private final RagPipelineService ragPipelineService;

    public RagController(RagPipelineService ragPipelineService) {
        this.ragPipelineService = ragPipelineService;
    }

    @GetMapping("/documents")
    public List<KnowledgeDocumentResponse> listDocuments(@AuthenticationPrincipal JwtPrincipal principal) {
        return ragPipelineService.listDocuments(principal);
    }

    @PostMapping("/documents")
    public KnowledgeDocumentResponse ingestDocument(
            @AuthenticationPrincipal JwtPrincipal principal,
            @Valid @RequestBody KnowledgeDocumentRequest request) {
        return ragPipelineService.ingestDocument(principal, request);
    }
}
