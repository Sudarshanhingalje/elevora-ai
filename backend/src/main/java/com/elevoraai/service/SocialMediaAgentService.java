package com.elevoraai.service;

import com.elevoraai.config.SecurityConfig.JwtPrincipal;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.validation.constraints.Future;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import java.nio.file.Files;
import java.nio.file.Path;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.sql.Timestamp;
import java.time.Instant;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import org.springframework.util.StringUtils;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.client.RestClient;
import org.springframework.web.server.ResponseStatusException;

@Service
public class SocialMediaAgentService {

    private final JdbcTemplate jdbcTemplate;
    private final RestClient restClient;
    private final ObjectMapper objectMapper;
    private final RagPipelineService ragPipelineService;
    private final String ollamaBaseUrl;
    private final String ollamaModel;
    private final String stableDiffusionBaseUrl;
    private final String comfyUiWorkflowPath;
    private final String instagramGraphBaseUrl;
    private final String instagramBusinessAccountId;
    private final String instagramAccessToken;

    public SocialMediaAgentService(
            JdbcTemplate jdbcTemplate,
            ObjectMapper objectMapper,
            RagPipelineService ragPipelineService,
            @Value("${app.ollama.base-url:http://localhost:11434}") String ollamaBaseUrl,
            @Value("${app.ollama.chat-model:llama3:8b}") String ollamaModel,
            @Value("${app.stable-diffusion.base-url:}") String stableDiffusionBaseUrl,
            @Value("${app.comfyui.workflow-path:}") String comfyUiWorkflowPath,
            @Value("${app.instagram.graph-base-url:https://graph.instagram.com}") String instagramGraphBaseUrl,
            @Value("${app.instagram.business-account-id:}") String instagramBusinessAccountId,
            @Value("${app.instagram.access-token:}") String instagramAccessToken) {
        this.jdbcTemplate = jdbcTemplate;
        this.restClient = RestClient.create();
        this.objectMapper = objectMapper;
        this.ragPipelineService = ragPipelineService;
        this.ollamaBaseUrl = ollamaBaseUrl;
        this.ollamaModel = ollamaModel;
        this.stableDiffusionBaseUrl = stableDiffusionBaseUrl;
        this.comfyUiWorkflowPath = comfyUiWorkflowPath;
        this.instagramGraphBaseUrl = instagramGraphBaseUrl;
        this.instagramBusinessAccountId = instagramBusinessAccountId;
        this.instagramAccessToken = instagramAccessToken;
    }

    public List<SocialPostResponse> listPosts(JwtPrincipal principal) {
        return jdbcTemplate.query(
                "SELECT id, tenant_id, platform, prompt, caption, image_prompt, image_url, status, scheduled_at, published_at, created_at "
                        + "FROM social_posts WHERE tenant_id = ? ORDER BY created_at DESC, id DESC",
                this::mapPost,
                principal.tenantId());
    }

    @Transactional
    public SocialPostResponse generatePost(JwtPrincipal principal, SocialPostRequest request) {
        String platform = normalizePlatform(request.platform());
        String context = ragPipelineService.retrieve(principal.tenantId(), request.prompt().trim(), 3)
                .stream()
                .map(RagPipelineService.RetrievedChunk::content)
                .reduce("", (left, right) -> left + "\n- " + right);
        String caption = generateCaption(platform, request.prompt().trim(), context);
        String imagePrompt = "Professional Indian SaaS marketplace visual for " + request.prompt().trim();
        String imageUrl = generateImageUrl(imagePrompt);
        jdbcTemplate.update(
                "INSERT INTO social_posts (tenant_id, platform, prompt, caption, image_prompt, image_url, status, scheduled_at) "
                        + "VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
                principal.tenantId(),
                platform,
                request.prompt().trim(),
                caption,
                imagePrompt,
                imageUrl,
                request.scheduledAt() == null ? "DRAFT" : "SCHEDULED",
                request.scheduledAt() == null ? null : Timestamp.from(request.scheduledAt()));
        Long postId = jdbcTemplate.queryForObject(
                "SELECT id FROM social_posts WHERE tenant_id = ? ORDER BY id DESC LIMIT 1",
                Long.class,
                principal.tenantId());
        jdbcTemplate.update(
                "INSERT INTO ai_agent_jobs (tenant_id, agent_type, entity_type, entity_id, status) VALUES (?, 'SOCIAL_MEDIA', 'social_posts', ?, 'DONE')",
                principal.tenantId(),
                postId);
        return getPost(principal.tenantId(), postId);
    }

    @Transactional
    public SocialPostResponse markPublished(JwtPrincipal principal, Long postId) {
        SocialPostResponse post = getPost(principal.tenantId(), postId);
        publishToInstagram(post);
        int updated = jdbcTemplate.update(
                "UPDATE social_posts SET status = 'PUBLISHED', published_at = CURRENT_TIMESTAMP WHERE tenant_id = ? AND id = ?",
                principal.tenantId(),
                postId);
        if (updated != 1) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Social post not found for tenant");
        }
        return getPost(principal.tenantId(), postId);
    }

    private void publishToInstagram(SocialPostResponse post) {
        if (!"INSTAGRAM".equals(post.platform())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Only Instagram publishing is configured for this agent");
        }
        if (!StringUtils.hasText(instagramBusinessAccountId) || !StringUtils.hasText(instagramAccessToken)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Instagram credentials are not configured");
        }
        if (!StringUtils.hasText(post.imageUrl())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Stable Diffusion image URL is required before Instagram publish");
        }
        JsonNode media = restClient.post()
                .uri(instagramGraphBaseUrl + "/" + instagramBusinessAccountId + "/media")
                .body(Map.of("image_url", post.imageUrl(), "caption", post.caption(), "access_token", instagramAccessToken))
                .retrieve()
                .body(JsonNode.class);
        String creationId = media == null || !media.hasNonNull("id") ? null : media.get("id").asText();
        if (!StringUtils.hasText(creationId)) {
            throw new ResponseStatusException(HttpStatus.BAD_GATEWAY, "Instagram media creation failed");
        }
        restClient.post()
                .uri(instagramGraphBaseUrl + "/" + instagramBusinessAccountId + "/media_publish")
                .body(Map.of("creation_id", creationId, "access_token", instagramAccessToken))
                .retrieve()
                .toBodilessEntity();
    }

    private String generateCaption(String platform, String prompt, String context) {
        try {
            JsonNode response = restClient.post()
                    .uri(ollamaBaseUrl + "/api/generate")
                    .body(Map.of(
                            "model", ollamaModel,
                            "stream", false,
                            "prompt", "Write a concise " + platform + " caption for Indian businesses. Include a clear CTA. Topic: "
                                    + prompt + ". Tenant knowledge: " + context))
                    .retrieve()
                    .body(JsonNode.class);
            if (response != null && response.hasNonNull("response")) {
                return response.get("response").asText().trim();
            }
        } catch (RuntimeException ignored) {
            return "Launch faster with Elevora AI. " + prompt + " Book a demo and automate your growth today.";
        }
        return "Launch faster with Elevora AI. " + prompt + " Book a demo and automate your growth today.";
    }

    private String generateImageUrl(String imagePrompt) {
        if (!StringUtils.hasText(stableDiffusionBaseUrl)) {
            return null;
        }
        if (!StringUtils.hasText(comfyUiWorkflowPath)) {
            return null;
        }
        try {
            String workflowJson = Files.readString(Path.of(comfyUiWorkflowPath))
                    .replace("{{PROMPT}}", imagePrompt.replace("\"", "\\\""));
            JsonNode workflow = objectMapper.readTree(workflowJson);
            JsonNode response = restClient.post()
                    .uri(stableDiffusionBaseUrl.replaceAll("/$", "") + "/prompt")
                    .body(Map.of("client_id", "elevora-social-agent", "prompt", workflow))
                    .retrieve()
                    .body(JsonNode.class);
            if (response != null && response.hasNonNull("prompt_id")) {
                return stableDiffusionBaseUrl.replaceAll("/$", "") + "/history/" + response.get("prompt_id").asText();
            }
        } catch (RuntimeException ignored) {
            return null;
        } catch (Exception ignored) {
            return null;
        }
        return null;
    }

    private SocialPostResponse getPost(Long tenantId, Long postId) {
        try {
            return jdbcTemplate.queryForObject(
                    "SELECT id, tenant_id, platform, prompt, caption, image_prompt, image_url, status, scheduled_at, published_at, created_at "
                            + "FROM social_posts WHERE tenant_id = ? AND id = ?",
                    this::mapPost,
                    tenantId,
                    postId);
        } catch (RuntimeException ex) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Social post not found for tenant");
        }
    }

    private SocialPostResponse mapPost(ResultSet rs, int rowNum) throws SQLException {
        Timestamp scheduledAt = rs.getTimestamp("scheduled_at");
        Timestamp publishedAt = rs.getTimestamp("published_at");
        return new SocialPostResponse(
                rs.getLong("id"),
                rs.getLong("tenant_id"),
                rs.getString("platform"),
                rs.getString("prompt"),
                rs.getString("caption"),
                rs.getString("image_prompt"),
                rs.getString("image_url"),
                rs.getString("status"),
                scheduledAt == null ? null : scheduledAt.toInstant(),
                publishedAt == null ? null : publishedAt.toInstant(),
                rs.getTimestamp("created_at").toInstant());
    }

    private String normalizePlatform(String platform) {
        String normalized = platform.trim().toUpperCase(Locale.ROOT);
        if (!List.of("INSTAGRAM", "FACEBOOK", "LINKEDIN").contains(normalized)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid social platform");
        }
        return normalized;
    }

    public record SocialPostRequest(
            @NotBlank @Pattern(regexp = "^(INSTAGRAM|FACEBOOK|LINKEDIN)$") String platform,
            @NotBlank @Size(max = 500) String prompt,
            @Future Instant scheduledAt) {
    }

    public record SocialPostResponse(
            Long id,
            Long tenantId,
            String platform,
            String prompt,
            String caption,
            String imagePrompt,
            String imageUrl,
            String status,
            Instant scheduledAt,
            Instant publishedAt,
            Instant createdAt) {
    }
}
