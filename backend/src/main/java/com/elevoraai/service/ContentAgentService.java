package com.elevoraai.service;

import com.elevoraai.config.SecurityConfig.JwtPrincipal;
import com.fasterxml.jackson.databind.JsonNode;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.sql.Timestamp;
import java.time.Instant;
import java.nio.charset.StandardCharsets;
import java.util.Base64;
import java.util.List;
import java.util.Map;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;
import org.springframework.web.client.RestClient;
import org.springframework.web.server.ResponseStatusException;

@Service
public class ContentAgentService {

    private final JdbcTemplate jdbcTemplate;
    private final RestClient restClient;
    private final RagPipelineService ragPipelineService;
    private final String ollamaBaseUrl;
    private final String ollamaModel;
    private final String wordpressBaseUrl;
    private final String wordpressUsername;
    private final String wordpressApplicationPassword;

    public ContentAgentService(
            JdbcTemplate jdbcTemplate,
            RagPipelineService ragPipelineService,
            @Value("${app.ollama.base-url:http://localhost:11434}") String ollamaBaseUrl,
            @Value("${app.ollama.chat-model:llama3:8b}") String ollamaModel,
            @Value("${app.wordpress.base-url:}") String wordpressBaseUrl,
            @Value("${app.wordpress.username:}") String wordpressUsername,
            @Value("${app.wordpress.application-password:}") String wordpressApplicationPassword) {
        this.jdbcTemplate = jdbcTemplate;
        this.restClient = RestClient.create();
        this.ragPipelineService = ragPipelineService;
        this.ollamaBaseUrl = ollamaBaseUrl;
        this.ollamaModel = ollamaModel;
        this.wordpressBaseUrl = wordpressBaseUrl;
        this.wordpressUsername = wordpressUsername;
        this.wordpressApplicationPassword = wordpressApplicationPassword;
    }

    public List<ContentPostResponse> listPosts(JwtPrincipal principal) {
        return jdbcTemplate.query(
                "SELECT id, tenant_id, title, topic, markdown, wordpress_post_id, status, published_at, created_at "
                        + "FROM content_posts WHERE tenant_id = ? ORDER BY created_at DESC, id DESC",
                this::mapPost,
                principal.tenantId());
    }

    @Transactional
    public ContentPostResponse generateDraft(JwtPrincipal principal, ContentDraftRequest request) {
        String context = ragPipelineService.retrieve(principal.tenantId(), request.topic().trim(), 4)
                .stream()
                .map(RagPipelineService.RetrievedChunk::content)
                .reduce("", (left, right) -> left + "\n- " + right);
        String markdown = generateMarkdown(request.title().trim(), request.topic().trim(), context);
        jdbcTemplate.update(
                "INSERT INTO content_posts (tenant_id, title, topic, markdown, status) VALUES (?, ?, ?, ?, 'DRAFT')",
                principal.tenantId(),
                request.title().trim(),
                request.topic().trim(),
                markdown);
        Long postId = jdbcTemplate.queryForObject(
                "SELECT id FROM content_posts WHERE tenant_id = ? ORDER BY id DESC LIMIT 1",
                Long.class,
                principal.tenantId());
        jdbcTemplate.update(
                "INSERT INTO ai_agent_jobs (tenant_id, agent_type, entity_type, entity_id, status) VALUES (?, 'CONTENT', 'content_posts', ?, 'DONE')",
                principal.tenantId(),
                postId);
        return getPost(principal.tenantId(), postId);
    }

    @Transactional
    public ContentPostResponse markPublished(JwtPrincipal principal, Long postId) {
        ContentPostResponse post = getPost(principal.tenantId(), postId);
        String wordpressPostId = publishToWordPress(post);
        int updated = jdbcTemplate.update(
                "UPDATE content_posts SET status = 'PUBLISHED', wordpress_post_id = ?, published_at = CURRENT_TIMESTAMP "
                        + "WHERE tenant_id = ? AND id = ?",
                wordpressPostId,
                principal.tenantId(),
                postId);
        if (updated != 1) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Content post not found for tenant");
        }
        return getPost(principal.tenantId(), postId);
    }

    private String publishToWordPress(ContentPostResponse post) {
        if (!StringUtils.hasText(wordpressBaseUrl) || !StringUtils.hasText(wordpressUsername) || !StringUtils.hasText(wordpressApplicationPassword)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "WordPress credentials are not configured");
        }
        String auth = Base64.getEncoder().encodeToString((wordpressUsername + ":" + wordpressApplicationPassword).getBytes(StandardCharsets.UTF_8));
        JsonNode response = restClient.post()
                .uri(wordpressBaseUrl.replaceAll("/$", "") + "/wp-json/wp/v2/posts")
                .contentType(MediaType.APPLICATION_JSON)
                .header("Authorization", "Basic " + auth)
                .body(Map.of("title", post.title(), "content", post.markdown(), "status", "publish"))
                .retrieve()
                .body(JsonNode.class);
        if (response == null || !response.hasNonNull("id")) {
            throw new ResponseStatusException(HttpStatus.BAD_GATEWAY, "WordPress publish failed");
        }
        return response.get("id").asText();
    }

    private String generateMarkdown(String title, String topic, String context) {
        try {
            JsonNode response = restClient.post()
                    .uri(ollamaBaseUrl + "/api/generate")
                    .body(Map.of(
                            "model", ollamaModel,
                            "stream", false,
                            "prompt", "Write a production-ready Markdown blog for an Indian AI SaaS marketplace. Title: "
                                    + title + ". Topic: " + topic + ". Use this tenant knowledge when relevant: "
                                    + context + ". Include H2 sections and a CTA."))
                    .retrieve()
                    .body(JsonNode.class);
            if (response != null && response.hasNonNull("response")) {
                return normalizeMarkdown(title, response.get("response").asText());
            }
        } catch (RuntimeException ignored) {
            return fallbackMarkdown(title, topic);
        }
        return fallbackMarkdown(title, topic);
    }

    private String normalizeMarkdown(String title, String markdown) {
        String trimmed = markdown.trim();
        return trimmed.startsWith("# ") ? trimmed : "# " + title + "\n\n" + trimmed;
    }

    private String fallbackMarkdown(String title, String topic) {
        return "# " + title + "\n\n"
                + "## Overview\n\n" + topic + " helps Indian businesses move faster with local AI automation.\n\n"
                + "## How Elevora AI Helps\n\nElevora AI combines marketplace products, secure tenant isolation, local AI, and one-click deployment.\n\n"
                + "## Next Step\n\nBrowse the marketplace, choose a product, and deploy it for your team.";
    }

    private ContentPostResponse getPost(Long tenantId, Long postId) {
        try {
            return jdbcTemplate.queryForObject(
                    "SELECT id, tenant_id, title, topic, markdown, wordpress_post_id, status, published_at, created_at "
                            + "FROM content_posts WHERE tenant_id = ? AND id = ?",
                    this::mapPost,
                    tenantId,
                    postId);
        } catch (RuntimeException ex) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Content post not found for tenant");
        }
    }

    private ContentPostResponse mapPost(ResultSet rs, int rowNum) throws SQLException {
        Timestamp publishedAt = rs.getTimestamp("published_at");
        return new ContentPostResponse(
                rs.getLong("id"),
                rs.getLong("tenant_id"),
                rs.getString("title"),
                rs.getString("topic"),
                rs.getString("markdown"),
                rs.getString("wordpress_post_id"),
                rs.getString("status"),
                publishedAt == null ? null : publishedAt.toInstant(),
                rs.getTimestamp("created_at").toInstant());
    }

    public record ContentDraftRequest(
            @NotBlank @Size(max = 255) String title,
            @NotBlank @Size(max = 255) String topic) {
    }

    public record ContentPostResponse(
            Long id,
            Long tenantId,
            String title,
            String topic,
            String markdown,
            String wordpressPostId,
            String status,
            Instant publishedAt,
            Instant createdAt) {
    }
}
