package com.elevoraai.controller;

import com.elevoraai.config.SecurityConfig.JwtPrincipal;
import com.elevoraai.service.ProductReviewService;
import com.elevoraai.service.ProductReviewService.CreateReviewCommand;
import com.elevoraai.service.ProductReviewService.ProductReviewResponse;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import java.util.List;
import org.springframework.security.core.Authentication;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@Validated
@RestController
@RequestMapping("/api/products/{slug}/reviews")
public class ProductReviewController {

    private final ProductReviewService productReviewService;

    public ProductReviewController(ProductReviewService productReviewService) {
        this.productReviewService = productReviewService;
    }

    @GetMapping
    public List<ProductReviewResponse> listReviews(
            @PathVariable
            @Pattern(regexp = "^[a-z0-9][a-z0-9-]*[a-z0-9]$")
            String slug,
            Authentication authentication) {
        JwtPrincipal principal = principal(authentication);
        return productReviewService.listReviews(principal.tenantId(), slug);
    }

    @PostMapping
    public ProductReviewResponse createReview(
            @PathVariable
            @Pattern(regexp = "^[a-z0-9][a-z0-9-]*[a-z0-9]$")
            String slug,
            @Valid @RequestBody CreateReviewRequest request,
            Authentication authentication) {
        JwtPrincipal principal = principal(authentication);
        return productReviewService.createReview(
                principal.tenantId(),
                principal.userId(),
                slug,
                new CreateReviewCommand(request.rating(), request.comment()));
    }

    private JwtPrincipal principal(Authentication authentication) {
        if (authentication == null || !(authentication.getPrincipal() instanceof JwtPrincipal jwtPrincipal)) {
            throw new IllegalStateException("Authenticated JWT principal is required");
        }
        return jwtPrincipal;
    }

    public record CreateReviewRequest(
            @Min(1)
            @Max(5)
            int rating,

            @NotBlank
            @Size(min = 4, max = 1200)
            String comment) {
    }
}
