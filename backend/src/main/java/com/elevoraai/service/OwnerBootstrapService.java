package com.elevoraai.service;

import java.security.SecureRandom;
import java.sql.PreparedStatement;
import java.sql.Statement;
import java.sql.Timestamp;
import java.time.Instant;
import java.util.Locale;
import java.util.Optional;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.core.annotation.Order;
import org.springframework.dao.EmptyResultDataAccessException;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.support.GeneratedKeyHolder;
import org.springframework.jdbc.support.KeyHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

@Service
@Order(10)
public class OwnerBootstrapService implements ApplicationRunner {

    private static final SecureRandom SECURE_RANDOM = new SecureRandom();
    private static final String TENANT_STATUS_ACTIVE = "ACTIVE";
    private static final String ADMIN_ROLE = "ADMIN";

    private final JdbcTemplate jdbcTemplate;
    private final PasswordEncoder passwordEncoder;
    private final String ownerEmail;
    private final String ownerPassword;
    private final String ownerTenantSlug;
    private final String ownerTenantName;

    public OwnerBootstrapService(
            JdbcTemplate jdbcTemplate,
            PasswordEncoder passwordEncoder,
            @Value("${app.owner.email:}") String ownerEmail,
            @Value("${app.owner.password:}") String ownerPassword,
            @Value("${app.owner.tenant-slug:elevora-ai}") String ownerTenantSlug,
            @Value("${app.owner.tenant-name:Elevora AI}") String ownerTenantName) {
        this.jdbcTemplate = jdbcTemplate;
        this.passwordEncoder = passwordEncoder;
        this.ownerEmail = ownerEmail;
        this.ownerPassword = ownerPassword;
        this.ownerTenantSlug = ownerTenantSlug;
        this.ownerTenantName = ownerTenantName;
    }

    @Override
    @Transactional
    public void run(ApplicationArguments args) {
        if (!StringUtils.hasText(ownerEmail) || !StringUtils.hasText(ownerPassword)) {
            return;
        }

        String email = normalizeEmail(ownerEmail);
        String tenantSlug = normalizeSlug(ownerTenantSlug);
        Long tenantId = findTenantIdBySlug(tenantSlug)
                .orElseGet(() -> createTenant(ownerTenantName, tenantSlug));
        String passwordHash = passwordEncoder.encode(ownerPassword);

        Optional<Long> existingUserId = findUserId(tenantId, email);
        Long userId = existingUserId.orElseGet(() -> createAdminUser(tenantId, email, passwordHash));

        if (existingUserId.isPresent()) {
            jdbcTemplate.update(
                    "UPDATE users SET password_hash = ?, role = ?, is_verified = true, otp_code = NULL, "
                            + "otp_expiry = NULL, updated_at = CURRENT_TIMESTAMP "
                            + "WHERE tenant_id = ? AND id = ? AND email = ?",
                    passwordHash,
                    ADMIN_ROLE,
                    tenantId,
                    userId,
                    email);
        }

        jdbcTemplate.update(
                "INSERT INTO activity_logs (tenant_id, user_id, action, entity_type, entity_id, ip_address) "
                        + "VALUES (?, ?, ?, ?, ?, ?)",
                tenantId,
                userId,
                "OWNER_BOOTSTRAP",
                "users",
                userId,
                "127.0.0.1");
    }

    private Optional<Long> findTenantIdBySlug(String tenantSlug) {
        try {
            Long tenantId = jdbcTemplate.queryForObject(
                    "SELECT id FROM tenants WHERE slug = ? AND tenant_id = id AND status = ?",
                    Long.class,
                    tenantSlug,
                    TENANT_STATUS_ACTIVE);
            return Optional.ofNullable(tenantId);
        } catch (EmptyResultDataAccessException ex) {
            return Optional.empty();
        }
    }

    private Long createTenant(String tenantName, String tenantSlug) {
        long temporaryTenantId = -Math.abs(SECURE_RANDOM.nextLong(1, Long.MAX_VALUE));
        KeyHolder keyHolder = new GeneratedKeyHolder();

        jdbcTemplate.update(connection -> {
            PreparedStatement ps = connection.prepareStatement(
                    "INSERT INTO tenants (tenant_id, name, slug, plan, status, created_at, updated_at) "
                            + "VALUES (?, ?, ?, 'PRO', ?, ?, ?)",
                    Statement.RETURN_GENERATED_KEYS);
            ps.setLong(1, temporaryTenantId);
            ps.setString(2, tenantName);
            ps.setString(3, tenantSlug);
            ps.setString(4, TENANT_STATUS_ACTIVE);
            Timestamp now = Timestamp.from(Instant.now());
            ps.setTimestamp(5, now);
            ps.setTimestamp(6, now);
            return ps;
        }, keyHolder);

        Long tenantId = keyHolder.getKey().longValue();
        jdbcTemplate.update(
                "UPDATE tenants SET tenant_id = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ? AND tenant_id = ?",
                tenantId,
                tenantId,
                temporaryTenantId);
        return tenantId;
    }

    private Optional<Long> findUserId(Long tenantId, String email) {
        try {
            Long userId = jdbcTemplate.queryForObject(
                    "SELECT id FROM users WHERE tenant_id = ? AND email = ?",
                    Long.class,
                    tenantId,
                    email);
            return Optional.ofNullable(userId);
        } catch (EmptyResultDataAccessException ex) {
            return Optional.empty();
        }
    }

    private Long createAdminUser(Long tenantId, String email, String passwordHash) {
        KeyHolder keyHolder = new GeneratedKeyHolder();
        jdbcTemplate.update(connection -> {
            PreparedStatement ps = connection.prepareStatement(
                    "INSERT INTO users (tenant_id, email, password_hash, role, otp_code, otp_expiry, is_verified, created_at, updated_at) "
                            + "VALUES (?, ?, ?, ?, NULL, NULL, true, ?, ?)",
                    Statement.RETURN_GENERATED_KEYS);
            ps.setLong(1, tenantId);
            ps.setString(2, email);
            ps.setString(3, passwordHash);
            ps.setString(4, ADMIN_ROLE);
            Timestamp now = Timestamp.from(Instant.now());
            ps.setTimestamp(5, now);
            ps.setTimestamp(6, now);
            return ps;
        }, keyHolder);
        return keyHolder.getKey().longValue();
    }

    private String normalizeEmail(String email) {
        return email.trim().toLowerCase(Locale.ROOT);
    }

    private String normalizeSlug(String slug) {
        return slug.trim().toLowerCase(Locale.ROOT);
    }
}
