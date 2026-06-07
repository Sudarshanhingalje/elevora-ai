package com.elevoraai.service;

import com.elevoraai.service.OrderService.OrderRecord;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import java.util.List;
import java.util.Map;

@Service
public class OrderEmailService {

    private static final Logger log = LoggerFactory.getLogger(OrderEmailService.class);

    private final EmailService emailService;
    private final JdbcTemplate jdbcTemplate;
    private final String frontendBaseUrl;

    public OrderEmailService(
            EmailService emailService,
            JdbcTemplate jdbcTemplate,
            @Value("${app.frontend-base-url:http://localhost:5173}") String frontendBaseUrl) {
        this.emailService = emailService;
        this.jdbcTemplate = jdbcTemplate;
        this.frontendBaseUrl = frontendBaseUrl;
    }

    public void sendOrderConfirmation(OrderRecord order) {
        try {
            // Get user info
            Map<String, Object> user = jdbcTemplate.queryForMap(
                    "SELECT email, is_verified FROM users WHERE tenant_id = ? AND id = ?",
                    order.tenantId(), order.userId());
            String email = (String) user.get("email");
            boolean isVerified = Boolean.TRUE.equals(user.get("is_verified"));

            // Get product name
            String productName = jdbcTemplate.queryForObject(
                    "SELECT name FROM products WHERE tenant_id = ? AND id = ?",
                    String.class, order.tenantId(), order.productId());

            // 1. Send Order Confirmation Email
            String confirmationSubject = "Thank You for Your Order - Elevora AI";
            String confirmationHtml = buildOrderConfirmationHtml(productName, order.id().toString());
            emailService.sendHtml(email, confirmationSubject, confirmationHtml);

            // 2. Send Email Verification Reminder if not verified
            if (!isVerified) {
                String verificationSubject = "Action Required: Verify your Elevora AI Account";
                String verificationHtml = buildVerificationReminderHtml(email, order.tenantId().toString());
                emailService.sendHtml(email, verificationSubject, verificationHtml);
            }

            // 3. Create Admin In-App Notifications
            notifyAdmins("New Order Received", "Order #" + order.id() + " has been placed for product: " + productName + " (Amount: " + order.amount() + " " + order.currency() + ")");

        } catch (Exception e) {
            log.error("Failed to process order confirmation emails for order ID: {}", order.id(), e);
        }
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
            log.info("Admin in-app notifications created successfully.");
        } catch (Exception e) {
            log.error("Failed to create admin notifications", e);
        }
    }

    private String buildOrderConfirmationHtml(String productName, String orderId) {
        return buildBaseTemplate("Order Confirmed!", 
            "<p style='font-size: 16px; line-height: 1.6; color: #cbd5e1;'>Congratulations on your purchase! We are thrilled to welcome you to the Elevora AI ecosystem.</p>" +
            "<p style='font-size: 16px; line-height: 1.6; color: #cbd5e1;'>Your payment was processed successfully. Here are your order details:</p>" +
            "<div style='background-color: #1e293b; border: 1px solid #334155; border-radius: 8px; padding: 20px; margin: 25px 0;'>" +
            "  <table style='width: 100%; border-collapse: collapse; text-align: left;'>" +
            "    <tr><td style='padding: 6px 0; color: #94a3b8; font-weight: 600;'>Product Name:</td><td style='padding: 6px 0; color: #f8fafc; text-align: right;'>" + productName + "</td></tr>" +
            "    <tr><td style='padding: 6px 0; color: #94a3b8; font-weight: 600;'>Order ID:</td><td style='padding: 6px 0; color: #38bdf8; text-align: right; font-family: monospace;'>" + orderId + "</td></tr>" +
            "  </table>" +
            "</div>" +
            "<p style='font-size: 15px; line-height: 1.6; color: #94a3b8; border-left: 4px solid #6366f1; padding-left: 12px; margin: 25px 0;'>" +
            "  Our automated system will begin deployment/setup of your environment within the next <strong>10–15 minutes</strong>. " +
            "  Once complete, a confirmation email containing your live access links and temporary credentials will be sent to you." +
            "</p>"
        );
    }

    private String buildVerificationReminderHtml(String email, String tenantId) {
        String verifyUrl = frontendBaseUrl + "/login?email=" + email;
        return buildBaseTemplate("Verify Your Account", 
            "<p style='font-size: 16px; line-height: 1.6; color: #cbd5e1;'>To ensure you receive direct deployment links and system status updates, please verify your account email address.</p>" +
            "<div style='text-align: center; margin: 35px 0;'>" +
            "  <a href='" + verifyUrl + "' style='display: inline-block; background: linear-gradient(135deg, #6366f1 0%, #4f46e5 100%); color: #ffffff; font-weight: bold; text-decoration: none; padding: 14px 30px; border-radius: 6px; box-shadow: 0 4px 12px rgba(99, 102, 241, 0.4);'>Verify Email Address</a>" +
            "</div>" +
            "<p style='font-size: 14px; line-height: 1.6; color: #64748b; text-align: center;'>" +
            "  Alternatively, copy and paste this URL into your browser:<br>" +
            "  <span style='color: #6366f1; word-break: break-all;'>" + verifyUrl + "</span>" +
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
