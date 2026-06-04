package com.elevoraai.service;

import java.math.BigDecimal;
import java.security.SecureRandom;
import java.sql.PreparedStatement;
import java.sql.Statement;
import java.sql.Timestamp;
import java.time.Instant;
import java.util.List;
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
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Order(20)
public class CatalogBootstrapService implements ApplicationRunner {

    private static final SecureRandom SECURE_RANDOM = new SecureRandom();

    private final JdbcTemplate jdbcTemplate;
    private final String tenantSlug;
    private final String tenantName;

    public CatalogBootstrapService(
            JdbcTemplate jdbcTemplate,
            @Value("${app.owner.tenant-slug:elevora-ai}") String tenantSlug,
            @Value("${app.owner.tenant-name:Elevora AI}") String tenantName) {
        this.jdbcTemplate = jdbcTemplate;
        this.tenantSlug = tenantSlug;
        this.tenantName = tenantName;
    }

    @Override
    @Transactional
    public void run(ApplicationArguments args) {
        Long tenantId = findTenantIdBySlug(normalizeSlug(tenantSlug))
                .orElseGet(() -> createTenant(tenantName, normalizeSlug(tenantSlug)));
        for (CatalogProduct product : products()) {
            upsertProduct(tenantId, product);
        }
    }

    private void upsertProduct(Long tenantId, CatalogProduct product) {
        Optional<Long> existingId = findProductId(tenantId, product.slug());
        if (existingId.isPresent()) {
            jdbcTemplate.update(
                    "UPDATE products SET name = ?, description = ?, price = ?, category = ?, demo_url = ?, "
                            + "docker_image = ?, status = 'ACTIVE' WHERE tenant_id = ? AND id = ? AND slug = ?",
                    product.name(),
                    product.description(),
                    product.price(),
                    product.category(),
                    product.demoUrl(),
                    product.dockerImage(),
                    tenantId,
                    existingId.get(),
                    product.slug());
            return;
        }

        jdbcTemplate.update(
                "INSERT INTO products (tenant_id, name, slug, description, price, category, demo_url, docker_image, status) "
                        + "VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'ACTIVE')",
                tenantId,
                product.name(),
                product.slug(),
                product.description(),
                product.price(),
                product.category(),
                product.demoUrl(),
                product.dockerImage());
    }

    private Optional<Long> findProductId(Long tenantId, String slug) {
        try {
            Long productId = jdbcTemplate.queryForObject(
                    "SELECT id FROM products WHERE tenant_id = ? AND slug = ?",
                    Long.class,
                    tenantId,
                    slug);
            return Optional.ofNullable(productId);
        } catch (EmptyResultDataAccessException ex) {
            return Optional.empty();
        }
    }

    private Optional<Long> findTenantIdBySlug(String slug) {
        try {
            Long tenantId = jdbcTemplate.queryForObject(
                    "SELECT id FROM tenants WHERE tenant_id = id AND slug = ? AND status = 'ACTIVE'",
                    Long.class,
                    slug);
            return Optional.ofNullable(tenantId);
        } catch (EmptyResultDataAccessException ex) {
            return Optional.empty();
        }
    }

    private Long createTenant(String name, String slug) {
        long temporaryTenantId = -Math.abs(SECURE_RANDOM.nextLong(1, Long.MAX_VALUE));
        KeyHolder keyHolder = new GeneratedKeyHolder();
        jdbcTemplate.update(connection -> {
            PreparedStatement ps = connection.prepareStatement(
                    "INSERT INTO tenants (tenant_id, name, slug, plan, status, created_at, updated_at) "
                            + "VALUES (?, ?, ?, 'FREE', 'ACTIVE', ?, ?)",
                    Statement.RETURN_GENERATED_KEYS);
            Timestamp now = Timestamp.from(Instant.now());
            ps.setLong(1, temporaryTenantId);
            ps.setString(2, name);
            ps.setString(3, slug);
            ps.setTimestamp(4, now);
            ps.setTimestamp(5, now);
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

    private String normalizeSlug(String slug) {
        return slug.trim().toLowerCase(Locale.ROOT);
    }

    private List<CatalogProduct> products() {
        return List.of(
                new CatalogProduct(
                        "Dental Clinic AI",
                        "dental-ai",
                        "WhatsApp booking, patient CRM, billing, and local AI assistant for dental clinics.",
                        new BigDecimal("119"),
                        "AI_WEBSITE",
                        "/assets/dentaldemovideo.mp4",
                        "elevora/dental-ai:latest"),
                new CatalogProduct(
                        "Gym Management AI",
                        "gym-ai",
                        "Membership reminders, WhatsApp automation, attendance, and billing workflows.",
                        new BigDecimal("155"),
                        "AUTOMATION",
                        "/demo/gym-ai",
                        "elevora/gym-ai:latest"),
                new CatalogProduct(
                        "CRM Follow-up AI",
                        "crm-ai",
                        "Lead capture, automated follow-ups, deal pipeline, and analytics for sales teams.",
                        new BigDecimal("179"),
                        "CRM",
                        "/demo/crm-ai",
                        "elevora/crm-ai:latest"),
                new CatalogProduct(
                        "E-Commerce Bot",
                        "ecommerce-bot",
                        "Storefront chatbot, order support, product search, and buyer automation.",
                        new BigDecimal("239"),
                        "CHATBOT",
                        "/demo/ecommerce-bot",
                        "elevora/ecommerce-bot:latest"),
                new CatalogProduct(
                        "Social Media Agent",
                        "social-media-agent",
                        "Instagram caption, image, schedule, and publishing automation with ComfyUI.",
                        new BigDecimal("109"),
                        "AUTOMATION",
                        "/demo/social-media-agent",
                        "elevora/social-media-agent:latest"),
                new CatalogProduct(
                        "Content Agent",
                        "content-agent",
                        "Blog drafting, WordPress publishing, and SEO assistant for local businesses.",
                        new BigDecimal("99"),
                        "TEMPLATE",
                        "/demo/content-agent",
                        "elevora/content-agent:latest"));
    }

    private record CatalogProduct(
            String name,
            String slug,
            String description,
            BigDecimal price,
            String category,
            String demoUrl,
            String dockerImage) {
    }
}
