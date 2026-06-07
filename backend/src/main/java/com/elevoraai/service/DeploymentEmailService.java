package com.elevoraai.service;

import com.elevoraai.service.OrderService.OrderRecord;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import java.util.List;
import java.util.Map;

@Service
public class DeploymentEmailService {

    private static final Logger log = LoggerFactory.getLogger(DeploymentEmailService.class);

    private final EmailService emailService;
    private final JdbcTemplate jdbcTemplate;

    public DeploymentEmailService(EmailService emailService, JdbcTemplate jdbcTemplate) {
        this.emailService = emailService;
        this.jdbcTemplate = jdbcTemplate;
    }

    public void sendDeploymentStarted(OrderRecord order) {
        try {
            Map<String, Object> details = fetchDetails(order);
            String email = (String) details.get("email");
            String productName = (String) details.get("productName");

            // 1. Send customer email
            String subject = "Your Deployment Has Started";
            String html = buildDeploymentStartedHtml(productName, order.id().toString());
            emailService.sendHtml(email, subject, html);

            // 2. In-app admin notification
            notifyAdmins("Deployment Started", "Deployment process has started for order #" + order.id() + " (" + productName + ").");

        } catch (Exception e) {
            log.error("Failed to send deployment started email for order ID: {}", order.id(), e);
        }
    }

    public void sendDeploymentSuccess(OrderRecord order, String subdomain) {
        try {
            Map<String, Object> details = fetchDetails(order);
            String email = (String) details.get("email");
            String productName = (String) details.get("productName");

            String deploymentUrl = "https://" + subdomain;

            // 1. Send customer email
            String subject = "Your Product Is Live";
            String html = buildDeploymentSuccessHtml(productName, order.id().toString(), deploymentUrl);
            emailService.sendHtml(email, subject, html);

            // 2. In-app admin notification
            notifyAdmins("Deployment Completed", "Deployment successfully completed for order #" + order.id() + " (" + productName + "). Live at: " + deploymentUrl);

        } catch (Exception e) {
            log.error("Failed to send deployment success email for order ID: {}", order.id(), e);
        }
    }

    public void sendDeploymentFailed(OrderRecord order) {
        try {
            Map<String, Object> details = fetchDetails(order);
            String email = (String) details.get("email");
            String productName = (String) details.get("productName");

            // 1. Send customer email
            String subject = "Deployment Requires Attention";
            String html = buildDeploymentFailedHtml(productName, order.id().toString());
            emailService.sendHtml(email, subject, html);

            // 2. In-app admin notification
            notifyAdmins("Deployment Failed", "Deployment failed for order #" + order.id() + " (" + productName + "). Needs investigation.");

        } catch (Exception e) {
            log.error("Failed to send deployment failure email for order ID: {}", order.id(), e);
        }
    }

    private Map<String, Object> fetchDetails(OrderRecord order) {
        String email = jdbcTemplate.queryForObject(
                "SELECT email FROM users WHERE tenant_id = ? AND id = ?",
                String.class, order.tenantId(), order.userId());
        String productName = jdbcTemplate.queryForObject(
                "SELECT name FROM products WHERE tenant_id = ? AND id = ?",
                String.class, order.tenantId(), order.productId());
        return Map.of("email", email != null ? email : "", "productName", productName != null ? productName : "AI Product");
    }

    private void notifyAdmins(String title, String body) {
        try {
            List<Map<String, Object>> admins = jdbcTemplate.queryForList(
                    "SELECT id, tenant_id FROM users WHERE role = 'ADMIN'");
            for (Map<String, Object> admin : admins) {
                Long adminId = ((Number) admin.get("id")).longValue();
                Long adminTenantId = ((Number) admin.get("tenant_id")).longValue();
                jdbcTemplate.update(
                        "INSERT INTO notifications (tenant_id, user_id, channel, title, body, status) VALUES (?, ?, 'IN_APP', ?, ?, 'SENT')",
                        adminTenantId, adminId, title, body);
            }
        } catch (Exception e) {
            log.error("Failed to create admin notifications", e);
        }
    }

    private String buildDeploymentStartedHtml(String productName, String orderId) {
        return buildBaseTemplate("Deployment Started", 
            "<p style='font-size: 16px; line-height: 1.6; color: #cbd5e1;'>Great news! The Elevora AI team and automation engine have officially started deploying your system.</p>" +
            "<div style='background-color: #1e293b; border: 1px solid #334155; border-radius: 8px; padding: 20px; margin: 25px 0;'>" +
            "  <table style='width: 100%; border-collapse: collapse; text-align: left;'>" +
            "    <tr><td style='padding: 6px 0; color: #94a3b8; font-weight: 600;'>Product Name:</td><td style='padding: 6px 0; color: #f8fafc; text-align: right;'>" + productName + "</td></tr>" +
            "    <tr><td style='padding: 6px 0; color: #94a3b8; font-weight: 600;'>Order ID:</td><td style='padding: 6px 0; color: #38bdf8; text-align: right; font-family: monospace;'>" + orderId + "</td></tr>" +
            "    <tr><td style='padding: 6px 0; color: #94a3b8; font-weight: 600;'>Expected Duration:</td><td style='padding: 6px 0; color: #10b981; text-align: right;'>5–10 Minutes</td></tr>" +
            "  </table>" +
            "</div>" +
            "<p style='font-size: 15px; line-height: 1.6; color: #94a3b8;'>" +
            "  We are currently setting up the database schemas, isolated docker containers, and SSL endpoints. " +
            "  You will receive another email as soon as the project goes live." +
            "</p>"
        );
    }

    private String buildDeploymentSuccessHtml(String productName, String orderId, String url) {
        return buildBaseTemplate("Your Product Is Live!", 
            "<p style='font-size: 16px; line-height: 1.6; color: #cbd5e1;'>Congratulations! Your purchased AI product is fully configured and ready for use.</p>" +
            "<div style='background-color: #1e293b; border: 1px solid #334155; border-radius: 8px; padding: 20px; margin: 25px 0;'>" +
            "  <table style='width: 100%; border-collapse: collapse; text-align: left;'>" +
            "    <tr><td style='padding: 6px 0; color: #94a3b8; font-weight: 600;'>Product Name:</td><td style='padding: 6px 0; color: #f8fafc; text-align: right;'>" + productName + "</td></tr>" +
            "    <tr><td style='padding: 6px 0; color: #94a3b8; font-weight: 600;'>Order ID:</td><td style='padding: 6px 0; color: #38bdf8; text-align: right; font-family: monospace;'>" + orderId + "</td></tr>" +
            "    <tr><td style='padding: 6px 0; color: #94a3b8; font-weight: 600;'>Status:</td><td style='padding: 6px 0; color: #10b981; text-align: right; font-weight: bold;'>DEPLOYED</td></tr>" +
            "  </table>" +
            "</div>" +
            "<div style='text-align: center; margin: 35px 0;'>" +
            "  <a href='" + url + "' style='display: inline-block; background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: #ffffff; font-weight: bold; text-decoration: none; padding: 14px 30px; border-radius: 6px; box-shadow: 0 4px 12px rgba(16, 185, 129, 0.4);'>Access Your Live Product</a>" +
            "</div>" +
            "<h3 style='color: #ffffff; font-size: 16px; margin: 25px 0 10px 0;'>Getting Started Instructions:</h3>" +
            "<ol style='color: #cbd5e1; font-size: 14px; padding-left: 20px; line-height: 1.6;'>" +
            "  <li>Click the link above to open your deployed instance.</li>" +
            "  <li>Use your existing Elevora AI login credentials to gain full administrative access.</li>" +
            "  <li>Configure your business properties under settings and start integrating!</li>" +
            "</ol>"
        );
    }

    private String buildDeploymentFailedHtml(String productName, String orderId) {
        return buildBaseTemplate("Deployment Requires Attention", 
            "<p style='font-size: 16px; line-height: 1.6; color: #cbd5e1;'>We encountered an unexpected technical issue during the deployment of your environment.</p>" +
            "<div style='background-color: #1e293b; border: 1px solid #334155; border-radius: 8px; padding: 20px; margin: 25px 0;'>" +
            "  <table style='width: 100%; border-collapse: collapse; text-align: left;'>" +
            "    <tr><td style='padding: 6px 0; color: #94a3b8; font-weight: 600;'>Product Name:</td><td style='padding: 6px 0; color: #f8fafc; text-align: right;'>" + productName + "</td></tr>" +
            "    <tr><td style='padding: 6px 0; color: #94a3b8; font-weight: 600;'>Order ID:</td><td style='padding: 6px 0; color: #38bdf8; text-align: right; font-family: monospace;'>" + orderId + "</td></tr>" +
            "    <tr><td style='padding: 6px 0; color: #94a3b8; font-weight: 600;'>Status:</td><td style='padding: 6px 0; color: #f43f5e; text-align: right; font-weight: bold;'>FLAGGED FOR REVIEW</td></tr>" +
            "  </table>" +
            "</div>" +
            "<p style='font-size: 15px; line-height: 1.6; color: #cbd5e1;'>" +
            "  Please rest assured that our engineering team has been notified automatically and is actively investigating the issue. " +
            "  No further action is required from your side; we will resolve it shortly and update you." +
            "</p>"
        );
    }

    private String buildBaseTemplate(String title, String content) {
        return "<!DOCTYPE html>" +
               "<html>" +
               "<head>" +
               "  <meta charset='utf-8'>" +
               "  <meta name='viewport' content='width=device-width, initial-scale=1.0'>" +
               "  <title>" + title + "</title>" +
               "</head>" +
               "<body style='margin: 0; padding: 0; background-color: #0f172a; font-family: -apple-system, BlinkMacSystemFont, \"Segoe UI\", Roboto, sans-serif; color: #f8fafc;'>" +
               "  <table align='center' border='0' cellpadding='0' cellspacing='0' width='100%' style='max-width: 600px; margin: 40px auto; background-color: #0b1329; border: 1px solid #1e293b; border-radius: 12px; overflow: hidden; box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.3);'>" +
               "    <!-- Header -->" +
               "    <tr>" +
               "      <td style='padding: 30px 40px; background: linear-gradient(to right, #0b1329, #1e1b4b); border-b: 1px solid #1e293b; text-align: center;'>" +
               "        <span style='font-size: 24px; font-weight: 900; letter-spacing: -0.5px; color: #ffffff;'>elevora<span style='color: #6366f1;'>.</span>ai</span>" +
               "      </td>" +
               "    </tr>" +
               "    <!-- Hero Title -->" +
               "    <tr>" +
               "      <td style='padding: 30px 40px 0 40px; text-align: center;'>" +
               "        <h1 style='font-size: 22px; font-weight: 700; margin: 0; color: #ffffff; letter-spacing: -0.3px;'>" + title + "</h1>" +
               "      </td>" +
               "    </tr>" +
               "    <!-- Content -->" +
               "    <tr>" +
               "      <td style='padding: 20px 40px 30px 40px;'>" +
               content +
               "      </td>" +
               "    </tr>" +
               "    <!-- Support / Contact -->" +
               "    <tr>" +
               "      <td style='padding: 20px 40px; background-color: #111a31; border-top: 1px solid #1e293b; border-bottom: 1px solid #1e293b; text-align: center;'>" +
               "        <p style='margin: 0; font-size: 14px; color: #94a3b8;'>Need assistance? Contact our team at <a href='mailto:elevoraai.team@gmail.com' style='color: #38bdf8; text-decoration: none; font-weight: 600;'>elevoraai.team@gmail.com</a></p>" +
               "      </td>" +
               "    </tr>" +
               "    <!-- Footer -->" +
               "    <tr>" +
               "      <td style='padding: 30px 40px; text-align: center;'>" +
               "        <p style='margin: 0 0 8px 0; font-size: 12px; color: #64748b;'>&copy; 2026 Elevora AI. All rights reserved.</p>" +
               "        <p style='margin: 0; font-size: 11px; color: #475569;'>This email was automatically generated. Please do not reply directly.</p>" +
               "      </td>" +
               "    </tr>" +
               "  </table>" +
               "</body>" +
               "</html>";
    }
}
