package com.elevoraai.controller;

import com.elevoraai.config.SecurityConfig.JwtPrincipal;
import com.elevoraai.service.ProductManagementService;
import com.elevoraai.service.ProductService.CreateProductCommand;
import com.elevoraai.service.ProductService.ProductResponse;
import com.elevoraai.service.ProductService.UpdateProductCommand;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/admin/products")
@PreAuthorize("hasRole('ADMIN')")
public class ProductManagementController {

    private final ProductManagementService productManagementService;

    public ProductManagementController(ProductManagementService productManagementService) {
        this.productManagementService = productManagementService;
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public ProductResponse addProduct(
            @AuthenticationPrincipal JwtPrincipal principal,
            @Valid @RequestBody CreateProductCommand command) {
        return productManagementService.addProduct(principal, command);
    }

    @PutMapping("/{productId}")
    public ProductResponse editProduct(
            @AuthenticationPrincipal JwtPrincipal principal,
            @PathVariable Long productId,
            @Valid @RequestBody UpdateProductCommand command) {
        if (!productId.equals(command.productId())) {
            throw new org.springframework.web.server.ResponseStatusException(
                    HttpStatus.BAD_REQUEST, "Product ID mismatch");
        }
        return productManagementService.editProduct(principal, command);
    }

    @DeleteMapping("/{productId}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deleteProduct(
            @AuthenticationPrincipal JwtPrincipal principal,
            @PathVariable Long productId) {
        productManagementService.deleteProduct(principal, productId);
    }

    @PostMapping("/{productId}/publish")
    public ProductResponse publishProduct(
            @AuthenticationPrincipal JwtPrincipal principal,
            @PathVariable Long productId) {
        return productManagementService.publishProduct(principal, productId);
    }

    @PostMapping("/{productId}/unpublish")
    public ProductResponse unpublishProduct(
            @AuthenticationPrincipal JwtPrincipal principal,
            @PathVariable Long productId) {
        return productManagementService.unpublishProduct(principal, productId);
    }
}
