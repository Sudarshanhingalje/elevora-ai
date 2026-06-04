package com.elevoraai.service;

import com.elevoraai.config.SecurityConfig.JwtPrincipal;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.FutureOrPresent;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import java.sql.Date;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.time.LocalDate;
import java.util.List;
import java.util.Locale;
import org.springframework.http.HttpStatus;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;
import org.springframework.web.server.ResponseStatusException;

@Service
public class GymAiService {

    private final JdbcTemplate jdbcTemplate;

    public GymAiService(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    public List<GymMemberResponse> listMembers(JwtPrincipal principal, String status) {
        if (StringUtils.hasText(status)) {
            return jdbcTemplate.query(
                    "SELECT id, tenant_id, full_name, phone, email, membership_plan, status, next_payment_date, created_at "
                            + "FROM gym_members WHERE tenant_id = ? AND status = ? ORDER BY next_payment_date ASC, id DESC",
                    this::mapMember,
                    principal.tenantId(),
                    normalizeStatus(status));
        }
        return jdbcTemplate.query(
                "SELECT id, tenant_id, full_name, phone, email, membership_plan, status, next_payment_date, created_at "
                        + "FROM gym_members WHERE tenant_id = ? ORDER BY next_payment_date ASC, id DESC",
                this::mapMember,
                principal.tenantId());
    }

    @Transactional
    public GymMemberResponse createMember(JwtPrincipal principal, GymMemberRequest request) {
        jdbcTemplate.update(
                "INSERT INTO gym_members (tenant_id, full_name, phone, email, membership_plan, status, next_payment_date) "
                        + "VALUES (?, ?, ?, ?, ?, 'ACTIVE', ?)",
                principal.tenantId(),
                request.fullName().trim(),
                request.phone().trim(),
                normalizeOptional(request.email()),
                normalizePlan(request.membershipPlan()),
                Date.valueOf(request.nextPaymentDate()));
        return jdbcTemplate.queryForObject(
                "SELECT id, tenant_id, full_name, phone, email, membership_plan, status, next_payment_date, created_at "
                        + "FROM gym_members WHERE tenant_id = ? AND phone = ?",
                this::mapMember,
                principal.tenantId(),
                request.phone().trim());
    }

    @Transactional
    public ReminderResponse queueReminder(JwtPrincipal principal, Long memberId) {
        GymMemberResponse member = findMember(principal.tenantId(), memberId);
        String message = "Hi " + member.fullName() + ", your " + member.membershipPlan().toLowerCase(Locale.ROOT)
                + " gym membership payment is due on " + member.nextPaymentDate() + ". Please renew to continue your plan.";
        jdbcTemplate.update(
                "INSERT INTO gym_reminders (tenant_id, member_id, channel, message, status) VALUES (?, ?, 'WHATSAPP', ?, 'QUEUED')",
                principal.tenantId(),
                memberId,
                message);
        jdbcTemplate.update(
                "UPDATE gym_members SET last_reminder_at = CURRENT_TIMESTAMP WHERE tenant_id = ? AND id = ?",
                principal.tenantId(),
                memberId);
        Long reminderId = jdbcTemplate.queryForObject(
                "SELECT id FROM gym_reminders WHERE tenant_id = ? AND member_id = ? ORDER BY id DESC LIMIT 1",
                Long.class,
                principal.tenantId(),
                memberId);
        return new ReminderResponse(reminderId, memberId, "WHATSAPP", message, "QUEUED");
    }

    private GymMemberResponse findMember(Long tenantId, Long memberId) {
        try {
            return jdbcTemplate.queryForObject(
                    "SELECT id, tenant_id, full_name, phone, email, membership_plan, status, next_payment_date, created_at "
                            + "FROM gym_members WHERE tenant_id = ? AND id = ?",
                    this::mapMember,
                    tenantId,
                    memberId);
        } catch (RuntimeException ex) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Gym member not found for tenant");
        }
    }

    private GymMemberResponse mapMember(ResultSet rs, int rowNum) throws SQLException {
        return new GymMemberResponse(
                rs.getLong("id"),
                rs.getLong("tenant_id"),
                rs.getString("full_name"),
                rs.getString("phone"),
                rs.getString("email"),
                rs.getString("membership_plan"),
                rs.getString("status"),
                rs.getDate("next_payment_date").toLocalDate(),
                rs.getTimestamp("created_at").toInstant());
    }

    private String normalizePlan(String plan) {
        String normalized = plan.trim().toUpperCase(Locale.ROOT);
        if (!List.of("MONTHLY", "QUARTERLY", "YEARLY").contains(normalized)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid membership plan");
        }
        return normalized;
    }

    private String normalizeStatus(String status) {
        String normalized = status.trim().toUpperCase(Locale.ROOT);
        if (!List.of("ACTIVE", "EXPIRED", "PAUSED").contains(normalized)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid member status");
        }
        return normalized;
    }

    private String normalizeOptional(String value) {
        return StringUtils.hasText(value) ? value.trim().toLowerCase(Locale.ROOT) : null;
    }

    public record GymMemberRequest(
            @NotBlank @Size(max = 160) String fullName,
            @NotBlank @Pattern(regexp = "^[6-9][0-9]{9}$") String phone,
            @Email @Size(max = 255) String email,
            @NotBlank @Pattern(regexp = "^(MONTHLY|QUARTERLY|YEARLY)$") String membershipPlan,
            @NotNull @FutureOrPresent LocalDate nextPaymentDate) {
    }

    public record GymMemberResponse(
            Long id,
            Long tenantId,
            String fullName,
            String phone,
            String email,
            String membershipPlan,
            String status,
            LocalDate nextPaymentDate,
            java.time.Instant createdAt) {
    }

    public record ReminderResponse(Long id, Long memberId, String channel, String message, String status) {
    }
}
