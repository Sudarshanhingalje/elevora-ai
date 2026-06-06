package com.elevoraai.service;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientException;

import java.util.List;
import java.util.Map;

/**
 * Polls campaign_posts every 60 seconds.
 * Any SCHEDULED post whose schedule_datetime <= NOW() is flipped to PROCESSING
 * and a trigger is sent to the n8n webhook for image generation + social posting.
 */
@Service
public class CampaignSchedulerService {

    private static final Logger log = LoggerFactory.getLogger(CampaignSchedulerService.class);

    private final JdbcTemplate jdbc;
    private final RestClient restClient;
    private final String n8nWebhookBaseUrl;
    private final String callbackSecret;
    private final String appBaseUrl;

    public CampaignSchedulerService(
            JdbcTemplate jdbc,
            @Value("${app.n8n.webhook-base-url:http://localhost:5678/webhook}") String n8nWebhookBaseUrl,
            @Value("${app.n8n.campaign-webhook-secret:elevora-n8n-secret-change-me}") String callbackSecret,
            @Value("${app.base-url:http://localhost:8080}") String appBaseUrl) {
        this.jdbc = jdbc;
        this.restClient = RestClient.create();
        this.n8nWebhookBaseUrl = n8nWebhookBaseUrl;
        this.callbackSecret = callbackSecret;
        this.appBaseUrl = appBaseUrl;
    }

    /**
     * Runs every 60 seconds. Picks up to 10 due posts per tick to avoid overload.
     */
    @Scheduled(fixedDelay = 60_000, initialDelay = 30_000)
    public void processScheduledPosts() {
        List<Map<String, Object>> duePosts = jdbc.queryForList(
                "SELECT id, tenant_id, campaign, title, content, hashtags, image_prompt, platforms " +
                "FROM campaign_posts " +
                "WHERE status = 'SCHEDULED' AND schedule_datetime <= NOW() " +
                "ORDER BY schedule_datetime ASC LIMIT 10");

        if (duePosts.isEmpty()) return;

        log.info("CampaignScheduler: found {} due post(s) to process", duePosts.size());

        for (Map<String, Object> post : duePosts) {
            Long id = ((Number) post.get("id")).longValue();
            try {
                // Atomic status flip → avoids double-processing in multi-instance setups
                int flipped = jdbc.update(
                        "UPDATE campaign_posts SET status = 'PROCESSING' WHERE id = ? AND status = 'SCHEDULED'", id);
                if (flipped == 0) {
                    log.debug("Post id={} already taken by another instance, skipping", id);
                    continue;
                }

                triggerN8nWorkflow(id, post);
                log.info("CampaignScheduler: triggered n8n for post id={} ('{}')", id, post.get("title"));

            } catch (RestClientException e) {
                log.error("n8n unreachable for post id={}: {} — marking FAILED", id, e.getMessage());
                jdbc.update("UPDATE campaign_posts SET status = 'FAILED' WHERE id = ?", id);
            } catch (Exception e) {
                log.error("Unexpected error processing post id={}: {}", id, e.getMessage(), e);
                jdbc.update("UPDATE campaign_posts SET status = 'FAILED' WHERE id = ?", id);
            }
        }
    }

    private void triggerN8nWorkflow(Long id, Map<String, Object> post) {
        String webhookUrl = n8nWebhookBaseUrl + "/elevora-campaign-publisher";
        String callbackUrl = appBaseUrl + "/api/internal/campaign-posts/" + id + "/callback";

        // Build payload — n8n workflow reads these fields
        var payload = new java.util.LinkedHashMap<String, Object>();
        payload.put("postId", id);
        payload.put("campaign", safe(post.get("campaign")));
        payload.put("title", safe(post.get("title")));
        payload.put("content", safe(post.get("content")));
        payload.put("hashtags", safe(post.get("hashtags")));
        payload.put("imagePrompt", safe(post.get("image_prompt")));
        payload.put("platforms", safe(post.get("platforms")));
        payload.put("callbackUrl", callbackUrl);
        payload.put("callbackSecret", callbackSecret);

        restClient.post()
                .uri(webhookUrl)
                .header("Content-Type", "application/json")
                .header("Connection", "close")
                .body(payload)
                .retrieve()
                .toBodilessEntity();
    }

    private String safe(Object val) {
        return val == null ? "" : val.toString().trim();
    }
}
