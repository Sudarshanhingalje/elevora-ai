package com.elevoraai.service;

import com.elevoraai.config.SecurityConfig.JwtPrincipal;
import com.elevoraai.service.RagPipelineService.RetrievedChunk;
import com.fasterxml.jackson.databind.JsonNode;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;
import org.springframework.web.server.ResponseStatusException;

@Service
public class RagChatService {

    private final RagPipelineService ragPipelineService;
    private final RestClient restClient;
    private final String ollamaBaseUrl;
    private final String chatModel;

    public RagChatService(
            RagPipelineService ragPipelineService,
            @Value("${app.ollama.base-url:http://localhost:11434}") String ollamaBaseUrl,
            @Value("${app.ollama.chat-model:llama3:8b}") String chatModel) {
        this.ragPipelineService = ragPipelineService;
        this.restClient = RestClient.create();
        this.ollamaBaseUrl = ollamaBaseUrl;
        this.chatModel = chatModel;
    }

    public RagChatResponse ask(JwtPrincipal principal, RagChatRequest request) {
        List<RetrievedChunk> chunks = ragPipelineService.retrieve(principal.tenantId(), request.message(), 5);
        String context = chunks.stream()
                .map(chunk -> "- " + chunk.content())
                .collect(Collectors.joining("\n"));
        String system = "You are Elevora AI. Answer using tenant-scoped product knowledge only. "
                + "If context is missing, say what needs to be indexed. Keep Indian SaaS marketplace tone practical.";
        JsonNode response = restClient.post()
                .uri(ollamaBaseUrl + "/api/chat")
                .body(Map.of(
                        "model", chatModel,
                        "stream", false,
                        "messages", List.of(
                                Map.of("role", "system", "content", system),
                                Map.of("role", "user", "content", "Context:\n" + context + "\n\nQuestion:\n" + request.message()))))
                .retrieve()
                .body(JsonNode.class);
        String answer = response == null ? null : response.path("message").path("content").asText(null);
        if (answer == null) {
            throw new ResponseStatusException(HttpStatus.BAD_GATEWAY, "RAG chat response is invalid");
        }
        return new RagChatResponse(answer, chunks);
    }

    public record RagChatRequest(@NotBlank @Size(min = 2, max = 1000) String message) {
    }

    public record RagChatResponse(String answer, List<RetrievedChunk> sources) {
    }
}
