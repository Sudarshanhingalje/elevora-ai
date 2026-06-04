package com.elevoraai.service;

import com.elevoraai.config.SecurityConfig.JwtPrincipal;
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

    private final ProductService productService;
    private final JdbcTemplate jdbcTemplate;

    public ProductManagementService(ProductService productService, JdbcTemplate jdbcTemplate) {
        this.productService = productService;
        this.jdbcTemplate = jdbcTemplate;
    }

    public ProductResponse addProduct(JwtPrincipal principal, CreateProductCommand command) {
        if (!principal.tenantId().equals(command.tenantId())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Cross-tenant action not allowed");
        }
        return productService.createProduct(command);
    }

    public ProductResponse editProduct(JwtPrincipal principal, UpdateProductCommand command) {
        if (!principal.tenantId().equals(command.tenantId())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Cross-tenant action not allowed");
        }
        return productService.updateProduct(command);
    }

    public void deleteProduct(JwtPrincipal principal, Long productId) {
        productService.deleteProduct(principal.tenantId(), productId);
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
        return productService.getProductById(principal.tenantId(), productId);
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
        return productService.getProductById(principal.tenantId(), productId);
    }
}
