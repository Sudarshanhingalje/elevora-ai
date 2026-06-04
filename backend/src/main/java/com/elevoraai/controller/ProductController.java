package com.elevoraai.controller;

import com.elevoraai.service.ProductService;
import com.elevoraai.service.ProductService.ProductResponse;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import java.util.List;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@Validated
@RestController
@RequestMapping("/api/products")
public class ProductController {

    private final ProductService productService;

    public ProductController(ProductService productService) {
        this.productService = productService;
    }

    @GetMapping
    public List<ProductResponse> listProducts(
            @RequestParam(defaultValue = "elevora-ai")
            @Pattern(regexp = "^[a-z0-9][a-z0-9-]*[a-z0-9]$")
            String tenantSlug,
            @RequestParam(required = false)
            @Pattern(regexp = "^(AI_WEBSITE|AUTOMATION|CRM|CHATBOT|TEMPLATE)$")
            String category,
            @RequestParam(required = false)
            @Size(max = 120)
            String search) {
        return productService.listActiveProducts(tenantSlug, category, search);
    }

    @GetMapping("/{slug}")
    public ProductResponse getProduct(
            @RequestParam(defaultValue = "elevora-ai")
            @Pattern(regexp = "^[a-z0-9][a-z0-9-]*[a-z0-9]$")
            String tenantSlug,
            @PathVariable
            @Pattern(regexp = "^[a-z0-9][a-z0-9-]*[a-z0-9]$")
            String slug) {
        return productService.getActiveProductBySlug(tenantSlug, slug);
    }
}
