package com.elevoraai.service;

import com.elevoraai.service.EmailCampaignRecipientsService.RecipientStats;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.atomic.AtomicBoolean;

/**
 * Drip Email Engine
 * -----------------
 * Schedule:
 *   • Send 1 email
 *   • Wait 1–2 minutes (randomised) between each email
 *   • After every 10 emails, pause 4 minutes
 *   • Hard stop at 100 emails per run
 *   • Remaining QUEUED recipients stay queued for the next run
 */
@Service
public class EmailDripEngineService {

    private static final Logger log = LoggerFactory.getLogger(EmailDripEngineService.class);

    private static final int  MAX_PER_RUN     = 100;
    private static final long MIN_DELAY_MS    = 60_000L;   // 1 minute
    private static final long MAX_DELAY_MS    = 120_000L;  // 2 minutes
    private static final int  BATCH_SIZE      = 10;
    private static final long BATCH_PAUSE_MS  = 240_000L;  // 4 minutes

    /** Track which campaigns are currently running so we can't double-start */
    private final ConcurrentHashMap<Long, AtomicBoolean> running = new ConcurrentHashMap<>();

    private final JdbcTemplate           jdbc;
    private final EmailService           emailService;
    private final String                 mailFrom;

    public EmailDripEngineService(
            JdbcTemplate jdbc,
            EmailService emailService,
            @Value("${app.mail.from:elevoraai.team@gmail.com}") String mailFrom) {
        this.jdbc         = jdbc;
        this.emailService = emailService;
        this.mailFrom     = mailFrom;
    }

    /**
     * Returns true if a drip run is already in progress for this campaign.
     */
    public boolean isRunning(Long campaignId) {
        AtomicBoolean flag = running.get(campaignId);
        return flag != null && flag.get();
    }

    /**
     * Stop a running drip run for a campaign.
     */
    public void stopRun(Long campaignId) {
        AtomicBoolean flag = running.get(campaignId);
        if (flag != null) {
            flag.set(false);
            log.info("[Drip] Stop requested for campaign {}", campaignId);
        }
    }

    /**
     * Kick off the drip run asynchronously.
     * Safe to call from a controller — runs in a separate thread.
     */
    @Async
    public void startDrip(Long campaignId, Long tenantId) {
        AtomicBoolean flag = running.computeIfAbsent(campaignId, k -> new AtomicBoolean(false));
        if (!flag.compareAndSet(false, true)) {
            log.warn("[Drip] Campaign {} is already running – ignoring duplicate start", campaignId);
            return;
        }

        log.info("[Drip] Starting drip run for campaign {}", campaignId);
        long runId = createDripRun(campaignId, tenantId);
        int sentCount = 0, failedCount = 0;

        try {
            // Fetch campaign details once
            Map<String, Object> campaign = jdbc.queryForMap(
                    "SELECT subject_line, headline, body_html, cta_text, cta_url, campaign_name "
                            + "FROM email_campaigns WHERE id = ? AND tenant_id = ?",
                    campaignId, tenantId);

            String subject   = str(campaign, "subject_line");
            String headline  = str(campaign, "headline");
            String bodyHtml  = str(campaign, "body_html");
            String ctaText   = str(campaign, "cta_text");
            String ctaUrl    = str(campaign, "cta_url");
            String campaignName = str(campaign, "campaign_name");

            while (flag.get() && sentCount + failedCount < MAX_PER_RUN) {
                // Fetch next QUEUED recipient
                List<Map<String, Object>> rows = jdbc.queryForList(
                        "SELECT id, email, name FROM email_campaign_recipients "
                                + "WHERE campaign_id = ? AND status = 'QUEUED' "
                                + "ORDER BY queue_position, id LIMIT 1",
                        campaignId);

                if (rows.isEmpty()) {
                    log.info("[Drip] Campaign {} — no more QUEUED recipients. Run complete.", campaignId);
                    break;
                }

                Map<String, Object> rec   = rows.get(0);
                Long   recipientId        = ((Number) rec.get("id")).longValue();
                String recipientEmail     = (String) rec.get("email");
                String recipientName      = rec.get("name") != null ? (String) rec.get("name") : "there";

                // Build personalised HTML
                String html = buildHtml(recipientName, subject, headline, bodyHtml, ctaText, ctaUrl, campaignName);

                // Send
                boolean ok = emailService.sendHtml(recipientEmail, subject, html);

                if (ok) {
                    jdbc.update(
                            "UPDATE email_campaign_recipients SET status = 'SENT', sent_at = NOW() WHERE id = ?",
                            recipientId);
                    sentCount++;
                    log.info("[Drip] ✅ Sent {}/{} to {} (campaign {})", sentCount, MAX_PER_RUN, recipientEmail, campaignId);
                } else {
                    jdbc.update(
                            "UPDATE email_campaign_recipients SET status = 'FAILED', fail_reason = 'SMTP error' WHERE id = ?",
                            recipientId);
                    failedCount++;
                    log.warn("[Drip] ❌ Failed to send to {} (campaign {})", recipientEmail, campaignId);
                }

                // Update live counters on campaign
                jdbc.update(
                        "UPDATE email_campaigns SET sent_count = ? WHERE id = ?",
                        sentCount, campaignId);

                int totalSent = sentCount + failedCount;

                // Pause after every BATCH_SIZE emails
                if (totalSent % BATCH_SIZE == 0 && totalSent < MAX_PER_RUN) {
                    log.info("[Drip] Campaign {} — batch of {} done. Pausing {}ms...",
                            campaignId, BATCH_SIZE, BATCH_PAUSE_MS);
                    sleep(BATCH_PAUSE_MS);
                } else if (totalSent < MAX_PER_RUN) {
                    // Wait 1–2 minutes between individual emails
                    long delay = MIN_DELAY_MS + (long)(Math.random() * (MAX_DELAY_MS - MIN_DELAY_MS));
                    log.info("[Drip] Campaign {} — waiting {}s before next email...", campaignId, delay / 1000);
                    sleep(delay);
                }
            }

            // Mark campaign SENT if all done
            RecipientStats stats = getStats(campaignId);
            if (stats.queued() == 0) {
                jdbc.update("UPDATE email_campaigns SET status = 'SENT', sent_at = NOW() WHERE id = ?", campaignId);
            } else {
                jdbc.update("UPDATE email_campaigns SET status = 'SCHEDULED' WHERE id = ?", campaignId);
                log.info("[Drip] Campaign {} — {} recipients remain queued for next run.", campaignId, stats.queued());
            }

            finishDripRun(runId, sentCount, failedCount, "COMPLETED");
            log.info("[Drip] Campaign {} run complete. Sent={}, Failed={}", campaignId, sentCount, failedCount);

        } catch (InterruptedException ie) {
            Thread.currentThread().interrupt();
            finishDripRun(runId, sentCount, failedCount, "STOPPED");
            log.info("[Drip] Campaign {} run interrupted/stopped.", campaignId);
        } catch (Exception ex) {
            finishDripRun(runId, sentCount, failedCount, "ERROR");
            log.error("[Drip] Campaign {} run ERROR: {}", campaignId, ex.getMessage(), ex);
        } finally {
            flag.set(false);
        }
    }

    // ── HTML builder ─────────────────────────────────────────────────────────
    private String buildHtml(String name, String subject, String headline,
                             String body, String ctaText, String ctaUrl, String campaignName) {
        String safeBody = body != null ? body : "<p>Thank you for being a valued Elevora AI customer.</p>";
        String safeHeadline = headline != null ? headline : subject;
        String safeCta = ctaText != null ? ctaText : "Explore Now →";
        String safeCtaUrl = ctaUrl != null ? ctaUrl : "https://elevora.ai/marketplace";

        return "<!DOCTYPE html><html lang=\"en\"><head>"
                + "<meta charset=\"UTF-8\"><meta name=\"viewport\" content=\"width=device-width,initial-scale=1\">"
                + "<title>" + safeEscape(subject) + "</title></head>"
                + "<body style=\"margin:0;padding:0;background:#0B1121;font-family:'Segoe UI',Arial,sans-serif;\">"
                + "<table width=\"100%\" cellpadding=\"0\" cellspacing=\"0\">"
                + "<tr><td align=\"center\" style=\"padding:40px 20px;\">"
                + "<table width=\"600\" cellpadding=\"0\" cellspacing=\"0\" style=\"background:#141A28;border-radius:16px;overflow:hidden;border:1px solid #1E293B;\">"

                // Header
                + "<tr><td style=\"background:linear-gradient(135deg,#4F46E5,#7C3AED);padding:32px 40px;\">"
                + "<p style=\"margin:0;font-size:22px;font-weight:900;color:#fff;letter-spacing:-0.5px;\">"
                + "elevora<span style=\"color:#A5B4FC;\">.</span>ai</p>"
                + "<p style=\"margin:8px 0 0;font-size:13px;color:#C7D2FE;\">AI Automation Marketplace</p>"
                + "</td></tr>"

                // Headline
                + "<tr><td style=\"padding:36px 40px 8px;\">"
                + "<h1 style=\"margin:0;font-size:26px;font-weight:800;color:#fff;line-height:1.3;\">"
                + safeEscape(safeHeadline) + "</h1>"
                + "</td></tr>"

                // Body
                + "<tr><td style=\"padding:16px 40px 8px;color:#94A3B8;font-size:15px;line-height:1.8;\">"
                + safeBody
                + "</td></tr>"

                // CTA Button
                + "<tr><td style=\"padding:28px 40px;\">"
                + "<a href=\"" + safeCtaUrl + "\" "
                + "style=\"display:inline-block;background:linear-gradient(135deg,#4F46E5,#7C3AED);"
                + "color:#fff;text-decoration:none;font-size:15px;font-weight:700;"
                + "padding:14px 32px;border-radius:10px;letter-spacing:0.3px;\">"
                + safeEscape(safeCta) + "</a>"
                + "</td></tr>"

                // Footer
                + "<tr><td style=\"background:#0B1121;padding:24px 40px;border-top:1px solid #1E293B;\">"
                + "<p style=\"margin:0;font-size:12px;color:#475569;text-align:center;\">"
                + "You're receiving this from Elevora AI because you signed up or purchased a product. "
                + "<br>© 2025 Elevora AI · <a href=\"https://elevora.ai\" style=\"color:#6366F1;\">elevora.ai</a>"
                + "</p></td></tr>"

                + "</table></td></tr></table></body></html>";
    }

    // ── Helpers ───────────────────────────────────────────────────────────────
    private void sleep(long ms) throws InterruptedException {
        Thread.sleep(ms);
    }

    private String str(Map<String, Object> m, String key) {
        Object v = m.get(key);
        return v != null ? v.toString() : null;
    }

    private String safeEscape(String s) {
        if (s == null) return "";
        return s.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;");
    }

    private long createDripRun(Long campaignId, Long tenantId) {
        jdbc.update(
                "INSERT INTO email_campaign_drip_runs (campaign_id, tenant_id, status) VALUES (?, ?, 'RUNNING')",
                campaignId, tenantId);
        Long id = jdbc.queryForObject(
                "SELECT id FROM email_campaign_drip_runs WHERE campaign_id = ? ORDER BY id DESC LIMIT 1",
                Long.class, campaignId);
        return id != null ? id : -1L;
    }

    private void finishDripRun(long runId, int sent, int failed, String status) {
        try {
            jdbc.update(
                    "UPDATE email_campaign_drip_runs SET finished_at = NOW(), emails_sent = ?, emails_failed = ?, status = ? WHERE id = ?",
                    sent, failed, status, runId);
        } catch (Exception e) {
            log.error("[Drip] Failed to update drip run {}: {}", runId, e.getMessage());
        }
    }

    private RecipientStats getStats(Long campaignId) {
        Integer q = jdbc.queryForObject(
                "SELECT COUNT(*) FROM email_campaign_recipients WHERE campaign_id = ? AND status = 'QUEUED'",
                Integer.class, campaignId);
        Integer s = jdbc.queryForObject(
                "SELECT COUNT(*) FROM email_campaign_recipients WHERE campaign_id = ? AND status = 'SENT'",
                Integer.class, campaignId);
        Integer f = jdbc.queryForObject(
                "SELECT COUNT(*) FROM email_campaign_recipients WHERE campaign_id = ? AND status = 'FAILED'",
                Integer.class, campaignId);
        return new RecipientStats(q == null ? 0 : q, s == null ? 0 : s, f == null ? 0 : f);
    }

    public record RecipientStats(int queued, int sent, int failed) {}
}
