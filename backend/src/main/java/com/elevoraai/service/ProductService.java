package com.elevoraai.service;

import java.math.BigDecimal;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.sql.Statement;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;
import java.util.Objects;
import java.util.Optional;
import org.springframework.dao.EmptyResultDataAccessException;
import org.springframework.http.HttpStatus;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.support.GeneratedKeyHolder;
import org.springframework.jdbc.support.KeyHolder;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;
import org.springframework.web.server.ResponseStatusException;

@Service
public class ProductService {

    private final JdbcTemplate jdbcTemplate;

    public ProductService(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    public List<ProductResponse> listActiveProducts(String tenantSlug, String category, String search) {
        Long tenantId = resolveTenantId(tenantSlug);
        List<Object> params = new ArrayList<>();
        params.add(tenantId);

        StringBuilder sql = new StringBuilder(
                "SELECT id, tenant_id, name, slug, description, price, category, demo_url, docker_image, status, features, tech_stack, video_url, screenshots, deployment_template, repository_info, created_at "
                        + "FROM products WHERE tenant_id = ? AND status = 'ACTIVE'");

        if (StringUtils.hasText(category)) {
            sql.append(" AND category = ?");
            params.add(category.trim().toUpperCase(Locale.ROOT));
        }

        if (StringUtils.hasText(search)) {
            sql.append(" AND (LOWER(name) LIKE ? OR LOWER(description) LIKE ?)");
            String query = "%" + search.trim().toLowerCase(Locale.ROOT) + "%";
            params.add(query);
            params.add(query);
        }

        sql.append(" ORDER BY created_at DESC, id DESC");
        return jdbcTemplate.query(sql.toString(), this::mapProduct, params.toArray());
    }

    public ProductResponse getActiveProductBySlug(String tenantSlug, String slug) {
        Long tenantId = resolveTenantId(tenantSlug);
        return getActiveProductBySlugAndTenant(tenantId, slug);
    }

    public ProductResponse getActiveProductBySlugAndTenant(Long tenantId, String slug) {
        try {
            return jdbcTemplate.queryForObject(
                    "SELECT id, tenant_id, name, slug, description, price, category, demo_url, docker_image, status, features, tech_stack, video_url, screenshots, deployment_template, repository_info, created_at "
                            + "FROM products WHERE tenant_id = ? AND slug = ? AND status = 'ACTIVE'",
                    this::mapProduct,
                    tenantId,
                    normalizeSlug(slug));
        } catch (EmptyResultDataAccessException ex) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Product not found");
        }
    }

    public ProductResponse getActiveProductById(Long tenantId, Long productId) {
        try {
            return jdbcTemplate.queryForObject(
                    "SELECT id, tenant_id, name, slug, description, price, category, demo_url, docker_image, status, features, tech_stack, video_url, screenshots, deployment_template, repository_info, created_at "
                            + "FROM products WHERE tenant_id = ? AND id = ? AND status = 'ACTIVE'",
                    this::mapProduct,
                    tenantId,
                    productId);
        } catch (EmptyResultDataAccessException ex) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Product not found");
        }
    }

    public ProductResponse createProduct(CreateProductCommand command) {
        validateProductCommand(command.name(), command.slug(), command.price(), command.category());
        KeyHolder keyHolder = new GeneratedKeyHolder();
        jdbcTemplate.update(connection -> {
            PreparedStatement ps = connection.prepareStatement(
                    "INSERT INTO products (tenant_id, name, slug, description, price, category, demo_url, docker_image, status, features, tech_stack, video_url, screenshots, deployment_template, repository_info) "
                            + "VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
                    Statement.RETURN_GENERATED_KEYS);
            ps.setLong(1, command.tenantId());
            ps.setString(2, command.name().trim());
            ps.setString(3, normalizeSlug(command.slug()));
            ps.setString(4, command.description());
            ps.setBigDecimal(5, command.price());
            ps.setString(6, command.category().trim().toUpperCase(Locale.ROOT));
            ps.setString(7, command.demoUrl());
            ps.setString(8, command.dockerImage());
            ps.setString(9, normalizeStatus(command.status()));
            ps.setString(10, command.features());
            ps.setString(11, command.techStack());
            ps.setString(12, command.videoUrl());
            ps.setString(13, command.screenshots());
            ps.setString(14, command.deploymentTemplate());
            ps.setString(15, command.repositoryInfo());
            return ps;
        }, keyHolder);

        Number key = keyHolder.getKey();
        if (key == null) {
            throw new IllegalStateException("Failed to create product");
        }
        return getProductById(command.tenantId(), key.longValue());
    }

    public ProductResponse updateProduct(UpdateProductCommand command) {
        validateProductCommand(command.name(), command.slug(), command.price(), command.category());
        int updatedRows = jdbcTemplate.update(
                "UPDATE products SET name = ?, slug = ?, description = ?, price = ?, category = ?, demo_url = ?, docker_image = ?, status = ?, features = ?, tech_stack = ?, video_url = ?, screenshots = ?, deployment_template = ?, repository_info = ? "
                        + "WHERE tenant_id = ? AND id = ?",
                command.name().trim(),
                normalizeSlug(command.slug()),
                command.description(),
                command.price(),
                command.category().trim().toUpperCase(Locale.ROOT),
                command.demoUrl(),
                command.dockerImage(),
                normalizeStatus(command.status()),
                command.features(),
                command.techStack(),
                command.videoUrl(),
                command.screenshots(),
                command.deploymentTemplate(),
                command.repositoryInfo(),
                command.tenantId(),
                command.productId());
        if (updatedRows != 1) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Product not found for tenant");
        }
        return getProductById(command.tenantId(), command.productId());
    }

    public void deleteProduct(Long tenantId, Long productId) {
        int updatedRows = jdbcTemplate.update(
                "UPDATE products SET status = 'ARCHIVED' WHERE tenant_id = ? AND id = ?",
                tenantId,
                productId);
        if (updatedRows != 1) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Product not found for tenant");
        }
    }

    public ProductResponse getProductById(Long tenantId, Long productId) {
        try {
            return jdbcTemplate.queryForObject(
                    "SELECT id, tenant_id, name, slug, description, price, category, demo_url, docker_image, status, features, tech_stack, video_url, screenshots, deployment_template, repository_info, created_at "
                            + "FROM products WHERE tenant_id = ? AND id = ?",
                    this::mapProduct,
                    tenantId,
                    productId);
        } catch (EmptyResultDataAccessException ex) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Product not found for tenant");
        }
    }

    public Long resolveTenantId(String tenantSlug) {
        String slug = normalizeSlug(tenantSlug);
        try {
            return jdbcTemplate.queryForObject(
                    "SELECT id FROM tenants WHERE tenant_id = id AND slug = ? AND status = 'ACTIVE'",
                    Long.class,
                    slug);
        } catch (EmptyResultDataAccessException ex) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Tenant not found");
        }
    }

    private ProductResponse mapProduct(ResultSet rs, int rowNum) throws SQLException {
        return new ProductResponse(
                rs.getLong("id"),
                rs.getLong("tenant_id"),
                rs.getString("name"),
                rs.getString("slug"),
                rs.getString("description"),
                rs.getBigDecimal("price"),
                rs.getString("category"),
                rs.getString("demo_url"),
                rs.getString("docker_image"),
                rs.getString("status"),
                rs.getString("features"),
                rs.getString("tech_stack"),
                rs.getString("video_url"),
                rs.getString("screenshots"),
                rs.getString("deployment_template"),
                rs.getString("repository_info"),
                Optional.ofNullable(rs.getTimestamp("created_at")).map(timestamp -> timestamp.toInstant()).orElse(null));
    }

    private String normalizeSlug(String slug) {
        if (!StringUtils.hasText(slug)) {
            return "elevora-ai";
        }
        return slug.trim().toLowerCase(Locale.ROOT);
    }

    private void validateProductCommand(String name, String slug, BigDecimal price, String category) {
        if (!StringUtils.hasText(name) || name.trim().length() > 255) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Product name is required and must be under 255 characters");
        }
        if (!StringUtils.hasText(slug) || !normalizeSlug(slug).matches("^[a-z0-9][a-z0-9-]*[a-z0-9]$")) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Product slug is invalid");
        }
        if (price == null || price.signum() < 0) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Product price must be non-negative");
        }
        if (!StringUtils.hasText(category) || !List.of("AI_WEBSITE", "AUTOMATION", "CRM", "CHATBOT", "TEMPLATE").contains(category.trim().toUpperCase(Locale.ROOT))) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Product category is invalid");
        }
    }

    private String normalizeStatus(String status) {
        if (!StringUtils.hasText(status)) {
            return "DRAFT";
        }
        String normalized = status.trim().toUpperCase(Locale.ROOT);
        if (!List.of("DRAFT", "ACTIVE", "INACTIVE", "ARCHIVED").contains(normalized)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Product status is invalid");
        }
        return normalized;
    }

    public record CreateProductCommand(
            Long tenantId,
            String name,
            String slug,
            String description,
            BigDecimal price,
            String category,
            String demoUrl,
            String dockerImage,
            String status,
            String features,
            String techStack,
            String videoUrl,
            String screenshots,
            String deploymentTemplate,
            String repositoryInfo) {
        public CreateProductCommand {
            Objects.requireNonNull(tenantId, "tenantId is required");
        }
    }

    public record UpdateProductCommand(
            Long tenantId,
            Long productId,
            String name,
            String slug,
            String description,
            BigDecimal price,
            String category,
            String demoUrl,
            String dockerImage,
            String status,
            String features,
            String techStack,
            String videoUrl,
            String screenshots,
            String deploymentTemplate,
            String repositoryInfo) {
        public UpdateProductCommand {
            Objects.requireNonNull(tenantId, "tenantId is required");
            Objects.requireNonNull(productId, "productId is required");
        }
    }

    public record ProductResponse(
            Long id,
            Long tenantId,
            String name,
            String slug,
            String description,
            BigDecimal price,
            String category,
            String demoUrl,
            String dockerImage,
            String status,
            String features,
            String techStack,
            String videoUrl,
            String screenshots,
            String deploymentTemplate,
            String repositoryInfo,
            Instant createdAt) {
    }
}
