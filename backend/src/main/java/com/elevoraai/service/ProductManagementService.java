package com.elevoraai.service;

import com.elevoraai.config.SecurityConfig.JwtPrincipal;
import com.elevoraai.service.AuditLogService.AuditEntry;
import com.elevoraai.service.ProductService.CreateProductCommand;
import com.elevoraai.service.ProductService.ProductResponse;
import com.elevoraai.service.ProductService.UpdateProductCommand;
import org.springframework.http.HttpStatus;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

@Service
public class ProductManagementService {

    private final ProductService    productService;
    private final JdbcTemplate      jdbcTemplate;
    private final AuditLogService   auditLogService;

    public ProductManagementService(ProductService productService,
                                    JdbcTemplate jdbcTemplate,
                                    AuditLogService auditLogService) {
        this.productService   = productService;
        this.jdbcTemplate     = jdbcTemplate;
        this.auditLogService  = auditLogService;
    }

    public ProductResponse addProduct(JwtPrincipal principal, CreateProductCommand command) {
        if (!principal.tenantId().equals(command.tenantId())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Cross-tenant action not allowed");
        }
        ProductResponse result = productService.createProduct(command);
        auditLogService.logSuccess(
                principal.tenantId(), principal.userId(), principal.email(), principal.role(),
                AuditLogService.ACTION_PRODUCT_CREATED,
                AuditLogService.ENTITY_PRODUCT,
                String.valueOf(result.id()),
                "Product created: " + result.name(),
                null);
        return result;
    }

    public ProductResponse editProduct(JwtPrincipal principal, UpdateProductCommand command) {
        if (!principal.tenantId().equals(command.tenantId())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Cross-tenant action not allowed");
        }
        ProductResponse result = productService.updateProduct(command);
        auditLogService.logSuccess(
                principal.tenantId(), principal.userId(), principal.email(), principal.role(),
                AuditLogService.ACTION_PRODUCT_UPDATED,
                AuditLogService.ENTITY_PRODUCT,
                String.valueOf(result.id()),
                "Product updated: " + result.name(),
                null);
        return result;
    }

    public java.util.List<ProductResponse> listAllProducts(JwtPrincipal principal) {
        return productService.listAllProductsForTenant(principal.tenantId());
    }

    public void deleteProduct(JwtPrincipal principal, Long productId) {
        productService.deleteProduct(principal.tenantId(), productId);
        auditLogService.logSuccess(
                principal.tenantId(), principal.userId(), principal.email(), principal.role(),
                AuditLogService.ACTION_PRODUCT_DELETED,
                AuditLogService.ENTITY_PRODUCT,
                String.valueOf(productId),
                "Product deleted: id=" + productId,
                null);
    }

    @Transactional
    public ProductResponse publishProduct(JwtPrincipal principal, Long productId) {
        int updated = jdbcTemplate.update(
                "UPDATE products SET status = 'ACTIVE' WHERE tenant_id = ? AND id = ?",
                principal.tenantId(),
                productId);
        if (updated != 1) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Product not found");
        }
        ProductResponse result = productService.getProductById(principal.tenantId(), productId);
        auditLogService.logSuccess(
                principal.tenantId(), principal.userId(), principal.email(), principal.role(),
                AuditLogService.ACTION_PRODUCT_PUBLISHED,
                AuditLogService.ENTITY_PRODUCT,
                String.valueOf(productId),
                "Product published: " + result.name(),
                null);
        return result;
    }

    @Transactional
    public ProductResponse unpublishProduct(JwtPrincipal principal, Long productId) {
        int updated = jdbcTemplate.update(
                "UPDATE products SET status = 'INACTIVE' WHERE tenant_id = ? AND id = ?",
                principal.tenantId(),
                productId);
        if (updated != 1) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Product not found");
        }
        ProductResponse result = productService.getProductById(principal.tenantId(), productId);
        auditLogService.logSuccess(
                principal.tenantId(), principal.userId(), principal.email(), principal.role(),
                AuditLogService.ACTION_PRODUCT_UNPUBLISHED,
                AuditLogService.ENTITY_PRODUCT,
                String.valueOf(productId),
                "Product unpublished: " + result.name(),
                null);
        return result;
    }
}
