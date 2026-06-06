package com.elevoraai.service;

import java.sql.ResultSet;
import java.sql.SQLException;
import java.time.Instant;
import java.util.List;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class ProductReviewService {

    private final JdbcTemplate jdbcTemplate;
    private final ProductService productService;

    public ProductReviewService(JdbcTemplate jdbcTemplate, ProductService productService) {
        this.jdbcTemplate = jdbcTemplate;
        this.productService = productService;
    }

    @Transactional(readOnly = true)
    public List<ProductReviewResponse> listPublicReviews(String tenantSlug) {
        Long tenantId = findTenantIdBySlug(tenantSlug);
        return jdbcTemplate.query(
                "SELECT r.id, r.tenant_id, r.product_id, r.user_id, u.email, r.rating, r.comment, r.created_at "
                        + "FROM product_reviews r "
                        + "JOIN users u ON u.tenant_id = r.tenant_id AND u.id = r.user_id "
                        + "WHERE r.tenant_id = ? AND r.status = 'PUBLISHED' "
                        + "ORDER BY r.created_at DESC, r.id DESC",
                this::mapReview,
                tenantId);
    }

    private Long findTenantIdBySlug(String slug) {
        try {
            return jdbcTemplate.queryForObject(
                    "SELECT id FROM tenants WHERE slug = ? AND status = 'ACTIVE'",
                    Long.class,
                    slug.trim().toLowerCase());
        } catch (org.springframework.dao.EmptyResultDataAccessException ex) {
            return 1L; // Fallback to tenant 1
        }
    }

    @Transactional(readOnly = true)
    public List<ProductReviewResponse> listReviews(Long tenantId, String slug) {
        ProductService.ProductResponse product = productService.getActiveProductBySlugAndTenant(tenantId, slug);
        return jdbcTemplate.query(
                "SELECT r.id, r.tenant_id, r.product_id, r.user_id, u.email, r.rating, r.comment, r.created_at "
                        + "FROM product_reviews r "
                        + "JOIN users u ON u.tenant_id = r.tenant_id AND u.id = r.user_id "
                        + "WHERE r.tenant_id = ? AND r.product_id = ? AND r.status = 'PUBLISHED' "
                        + "ORDER BY r.created_at DESC, r.id DESC",
                this::mapReview,
                tenantId,
                product.id());
    }

    @Transactional
    public ProductReviewResponse createReview(Long tenantId, Long userId, String slug, CreateReviewCommand command) {
        ProductService.ProductResponse product = productService.getActiveProductBySlugAndTenant(tenantId, slug);

        jdbcTemplate.update(
                "INSERT INTO product_reviews (tenant_id, product_id, user_id, rating, comment, status) "
                        + "VALUES (?, ?, ?, ?, ?, 'PUBLISHED')",
                tenantId,
                product.id(),
                userId,
                command.rating(),
                command.comment().trim());

        Long reviewId = jdbcTemplate.queryForObject(
                "SELECT id FROM product_reviews WHERE tenant_id = ? AND product_id = ? AND user_id = ? ORDER BY id DESC LIMIT 1",
                Long.class,
                tenantId,
                product.id(),
                userId);

        return jdbcTemplate.queryForObject(
                "SELECT r.id, r.tenant_id, r.product_id, r.user_id, u.email, r.rating, r.comment, r.created_at "
                        + "FROM product_reviews r "
                        + "JOIN users u ON u.tenant_id = r.tenant_id AND u.id = r.user_id "
                        + "WHERE r.tenant_id = ? AND r.id = ?",
                this::mapReview,
                tenantId,
                reviewId);
    }

    private ProductReviewResponse mapReview(ResultSet rs, int rowNum) throws SQLException {
        return new ProductReviewResponse(
                rs.getLong("id"),
                rs.getLong("tenant_id"),
                rs.getLong("product_id"),
                rs.getLong("user_id"),
                maskEmail(rs.getString("email")),
                rs.getInt("rating"),
                rs.getString("comment"),
                rs.getTimestamp("created_at").toInstant());
    }

    private String maskEmail(String email) {
        int at = email.indexOf('@');
        if (at <= 1) {
            return "Verified buyer";
        }
        return email.charAt(0) + "***" + email.substring(at);
    }

    public record CreateReviewCommand(int rating, String comment) {
    }

    public record ProductReviewResponse(Long id, Long tenantId, Long productId, Long userId, String reviewer, int rating, String comment, Instant createdAt) {
    }
}
