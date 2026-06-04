package com.elevoraai.service;

import com.elevoraai.config.SecurityConfig.JwtPrincipal;
import com.fasterxml.jackson.databind.JsonNode;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import java.sql.PreparedStatement;
import java.sql.Statement;
import java.sql.Timestamp;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.support.GeneratedKeyHolder;
import org.springframework.jdbc.support.KeyHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;
import org.springframework.web.client.RestClient;
import org.springframework.web.server.ResponseStatusException;

@Service
public class RagPipelineService {

    private static final int CHUNK_SIZE = 900;
    private static final int CHUNK_OVERLAP = 120;

    private final JdbcTemplate jdbcTemplate;
    private final RestClient restClient;
    private final String ollamaBaseUrl;
    private final String embeddingModel;
    private final String qdrantBaseUrl;
    private final String qdrantApiKey;
    private final String qdrantCollection;

    public RagPipelineService(
            JdbcTemplate jdbcTemplate,
            @Value("${app.ollama.base-url:http://localhost:11434}") String ollamaBaseUrl,
            @Value("${app.ollama.embedding-model:nomic-embed-text}") String embeddingModel,
            @Value("${app.qdrant.base-url:http://localhost:6333}") String qdrantBaseUrl,
            @Value("${app.qdrant.api-key:}") String qdrantApiKey,
            @Value("${app.qdrant.collection:elevora_knowledge}") String qdrantCollection) {
        this.jdbcTemplate = jdbcTemplate;
        this.restClient = RestClient.create();
        this.ollamaBaseUrl = ollamaBaseUrl;
        this.embeddingModel = embeddingModel;
        this.qdrantBaseUrl = qdrantBaseUrl;
        this.qdrantApiKey = qdrantApiKey;
        this.qdrantCollection = qdrantCollection;
    }

    @Transactional
    public KnowledgeDocumentResponse ingestDocument(JwtPrincipal principal, KnowledgeDocumentRequest request) {
        ensureCollection();
        KeyHolder keyHolder = new GeneratedKeyHolder();
        jdbcTemplate.update(connection -> {
            PreparedStatement ps = connection.prepareStatement(
                    "INSERT INTO knowledge_documents (tenant_id, title, source_type, source_ref, status) VALUES (?, ?, ?, ?, 'INDEXED')",
                    Statement.RETURN_GENERATED_KEYS);
            ps.setLong(1, principal.tenantId());
            ps.setString(2, request.title().trim());
            ps.setString(3, request.sourceType());
            ps.setString(4, request.sourceRef());
            return ps;
        }, keyHolder);
        Long documentId = keyHolder.getKey().longValue();
        List<String> chunks = chunk(request.content());
        for (int i = 0; i < chunks.size(); i++) {
            String content = chunks.get(i);
            String pointId = UUID.randomUUID().toString();
            List<Double> vector = embed(content);
            upsertPoint(principal.tenantId(), documentId, pointId, i, content, vector);
            jdbcTemplate.update(
                    "INSERT INTO knowledge_chunks (tenant_id, document_id, qdrant_point_id, chunk_index, content, token_count) "
                            + "VALUES (?, ?, ?, ?, ?, ?)",
                    principal.tenantId(),
                    documentId,
                    pointId,
                    i,
                    content,
                    estimateTokens(content));
        }
        return getDocument(principal.tenantId(), documentId);
    }

    public List<KnowledgeDocumentResponse> listDocuments(JwtPrincipal principal) {
        return jdbcTemplate.query(
                "SELECT d.id, d.tenant_id, d.title, d.source_type, d.source_ref, d.status, d.created_at, COUNT(c.id) AS chunk_count "
                        + "FROM knowledge_documents d LEFT JOIN knowledge_chunks c ON c.tenant_id = d.tenant_id AND c.document_id = d.id "
                        + "WHERE d.tenant_id = ? GROUP BY d.id, d.tenant_id, d.title, d.source_type, d.source_ref, d.status, d.created_at "
                        + "ORDER BY d.created_at DESC, d.id DESC",
                (rs, rowNum) -> new KnowledgeDocumentResponse(
                        rs.getLong("id"),
                        rs.getLong("tenant_id"),
                        rs.getString("title"),
                        rs.getString("source_type"),
                        rs.getString("source_ref"),
                        rs.getString("status"),
                        rs.getInt("chunk_count"),
                        rs.getTimestamp("created_at").toInstant()),
                principal.tenantId());
    }

    public List<RetrievedChunk> retrieve(Long tenantId, String question, int limit) {
        ensureCollection();
        List<Double> vector = embed(question);
        JsonNode response = qdrantRequest("POST", "/collections/" + qdrantCollection + "/points/search", Map.of(
                "vector", vector,
                "limit", Math.max(1, Math.min(limit, 8)),
                "with_payload", true,
                "filter", Map.of("must", List.of(Map.of("key", "tenant_id", "match", Map.of("value", tenantId))))));
        List<RetrievedChunk> chunks = new ArrayList<>();
        JsonNode result = response == null ? null : response.get("result");
        if (result != null && result.isArray()) {
            for (JsonNode item : result) {
                JsonNode payload = item.get("payload");
                if (payload != null) {
                    chunks.add(new RetrievedChunk(
                            payload.path("document_id").asLong(),
                            payload.path("chunk_index").asInt(),
                            payload.path("content").asText(),
                            item.path("score").asDouble()));
                }
            }
        }
        return chunks;
    }

    private KnowledgeDocumentResponse getDocument(Long tenantId, Long documentId) {
        return jdbcTemplate.queryForObject(
                "SELECT d.id, d.tenant_id, d.title, d.source_type, d.source_ref, d.status, d.created_at, COUNT(c.id) AS chunk_count "
                        + "FROM knowledge_documents d LEFT JOIN knowledge_chunks c ON c.tenant_id = d.tenant_id AND c.document_id = d.id "
                        + "WHERE d.tenant_id = ? AND d.id = ? GROUP BY d.id, d.tenant_id, d.title, d.source_type, d.source_ref, d.status, d.created_at",
                (rs, rowNum) -> new KnowledgeDocumentResponse(
                        rs.getLong("id"),
                        rs.getLong("tenant_id"),
                        rs.getString("title"),
                        rs.getString("source_type"),
                        rs.getString("source_ref"),
                        rs.getString("status"),
                        rs.getInt("chunk_count"),
                        rs.getTimestamp("created_at").toInstant()),
                tenantId,
                documentId);
    }

    private void ensureCollection() {
        try {
            qdrantRequest("PUT", "/collections/" + qdrantCollection, Map.of(
                    "vectors", Map.of("size", 768, "distance", "Cosine")));
        } catch (RuntimeException ignored) {
        }
    }

    private List<Double> embed(String text) {
        JsonNode response = restClient.post()
                .uri(ollamaBaseUrl + "/api/embeddings")
                .body(Map.of("model", embeddingModel, "prompt", text))
                .retrieve()
                .body(JsonNode.class);
        JsonNode embedding = response == null ? null : response.get("embedding");
        if (embedding == null || !embedding.isArray()) {
            throw new ResponseStatusException(HttpStatus.BAD_GATEWAY, "Ollama embedding response is invalid");
        }
        List<Double> vector = new ArrayList<>();
        embedding.forEach(value -> vector.add(value.asDouble()));
        return vector;
    }

    private void upsertPoint(Long tenantId, Long documentId, String pointId, int chunkIndex, String content, List<Double> vector) {
        qdrantRequest("PUT", "/collections/" + qdrantCollection + "/points?wait=true", Map.of(
                "points", List.of(Map.of(
                        "id", pointId,
                        "vector", vector,
                        "payload", Map.of(
                                "tenant_id", tenantId,
                                "document_id", documentId,
                                "chunk_index", chunkIndex,
                                "content", content)))));
    }

    private JsonNode qdrantRequest(String method, String path, Object body) {
        RestClient.RequestBodySpec spec = switch (method) {
            case "PUT" -> restClient.put().uri(qdrantBaseUrl + path);
            case "POST" -> restClient.post().uri(qdrantBaseUrl + path);
            default -> throw new IllegalArgumentException("Unsupported Qdrant method");
        };
        if (StringUtils.hasText(qdrantApiKey)) {
            spec.header("api-key", qdrantApiKey);
        }
        return spec.header(HttpHeaders.CONTENT_TYPE, "application/json")
                .body(body)
                .retrieve()
                .body(JsonNode.class);
    }

    private List<String> chunk(String content) {
        String normalized = content.trim().replaceAll("\\s+", " ");
        List<String> chunks = new ArrayList<>();
        int start = 0;
        while (start < normalized.length()) {
            int end = Math.min(start + CHUNK_SIZE, normalized.length());
            chunks.add(normalized.substring(start, end));
            if (end == normalized.length()) {
                break;
            }
            start = Math.max(0, end - CHUNK_OVERLAP);
        }
        return chunks;
    }

    private int estimateTokens(String content) {
        return Math.max(1, content.length() / 4);
    }

    public record KnowledgeDocumentRequest(
            @NotBlank @Size(max = 255) String title,
            @NotBlank @Pattern(regexp = "^(PRODUCT|MANUAL|URL)$") String sourceType,
            @Size(max = 500) String sourceRef,
            @NotBlank @Size(max = 50000) String content) {
    }

    public record KnowledgeDocumentResponse(
            Long id,
            Long tenantId,
            String title,
            String sourceType,
            String sourceRef,
            String status,
            Integer chunkCount,
            Instant createdAt) {
    }

    public record RetrievedChunk(Long documentId, Integer chunkIndex, String content, Double score) {
    }
}
