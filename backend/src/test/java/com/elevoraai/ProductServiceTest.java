package com.elevoraai;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.elevoraai.service.ProductService;
import com.elevoraai.service.ProductService.CreateProductCommand;
import com.elevoraai.service.ProductService.ProductResponse;
import com.elevoraai.service.ProductService.UpdateProductCommand;
import java.math.BigDecimal;
import java.sql.PreparedStatement;
import java.sql.Statement;
import java.time.Instant;
import java.util.List;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.MockitoAnnotations;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.core.PreparedStatementCreator;
import org.springframework.jdbc.core.RowMapper;
import org.springframework.jdbc.support.GeneratedKeyHolder;
import org.springframework.web.server.ResponseStatusException;

class ProductServiceTest {

    @Mock
    private JdbcTemplate jdbcTemplate;

    private ProductService productService;

    @BeforeEach
    void setUp() {
        MockitoAnnotations.openMocks(this);
        productService = new ProductService(jdbcTemplate);
    }

    @Test
    void listActiveProductsFiltersByTenantId() {
        ProductResponse product = product();
        when(jdbcTemplate.queryForObject(
                eq("SELECT id FROM tenants WHERE tenant_id = id AND slug = ? AND status = 'ACTIVE'"),
                eq(Long.class),
                eq("elevora-ai"))).thenReturn(1L);
        when(jdbcTemplate.query(anyString(), any(RowMapper.class), any(Object[].class))).thenReturn(List.of(product));

        List<ProductResponse> products = productService.listActiveProducts("elevora-ai", "CHATBOT", "clinic");

        assertEquals(1, products.size());
        ArgumentCaptor<String> sql = ArgumentCaptor.forClass(String.class);
        verify(jdbcTemplate).query(sql.capture(), any(RowMapper.class), any(Object[].class));
        assertEquals(true, sql.getValue().contains("FROM products WHERE tenant_id = ? AND status = 'ACTIVE'"));
    }

    @Test
    void getByIdFiltersByTenantId() {
        ProductResponse product = product();
        when(jdbcTemplate.queryForObject(anyString(), any(RowMapper.class), eq(1L), eq(99L))).thenReturn(product);

        ProductResponse result = productService.getProductById(1L, 99L);

        assertEquals(99L, result.id());
        ArgumentCaptor<String> sql = ArgumentCaptor.forClass(String.class);
        verify(jdbcTemplate).queryForObject(sql.capture(), any(RowMapper.class), eq(1L), eq(99L));
        assertEquals(true, sql.getValue().contains("WHERE tenant_id = ? AND id = ?"));
    }

    @Test
    void tenantIsolationBlocksOtherTenantProduct() {
        when(jdbcTemplate.queryForObject(anyString(), any(RowMapper.class), eq(1L), eq(99L)))
                .thenThrow(new org.springframework.dao.EmptyResultDataAccessException(1));

        assertThrows(ResponseStatusException.class, () -> productService.getProductById(1L, 99L));

        ArgumentCaptor<String> sql = ArgumentCaptor.forClass(String.class);
        verify(jdbcTemplate).queryForObject(sql.capture(), any(RowMapper.class), eq(1L), eq(99L));
        assertEquals(true, sql.getValue().contains("WHERE tenant_id = ? AND id = ?"));
    }

    @Test
    void createProductUsesTenantIdAndReturnsCreatedProduct() throws Exception {
        when(jdbcTemplate.update(any(PreparedStatementCreator.class), any(GeneratedKeyHolder.class))).thenAnswer(invocation -> {
            GeneratedKeyHolder keyHolder = invocation.getArgument(1);
            java.util.Map<String, Object> keys = new java.util.HashMap<>();
            keys.put("GENERATED_KEY", 99L);
            keyHolder.getKeyList().add(keys);
            return 1;
        });
        when(jdbcTemplate.queryForObject(anyString(), any(RowMapper.class), eq(1L), eq(99L))).thenReturn(product());

        // CreateProductCommand: tenantId, name, slug, description, price, category,
        //   demoUrl, dockerImage, status, features, techStack, videoUrl, screenshots,
        //   deploymentTemplate, repositoryInfo  (15 fields)
        ProductResponse created = productService.createProduct(new CreateProductCommand(
                1L,
                "Dental AI",
                "dental-ai",
                "Clinic automation",
                BigDecimal.valueOf(4999),
                "CHATBOT",
                "https://demo.elevora.ai",
                "ghcr.io/elevora/dental-ai:latest",
                "ACTIVE",
                null,
                null,
                null,
                null,
                null,
                null));

        assertEquals(99L, created.id());
        verify(jdbcTemplate).update(any(PreparedStatementCreator.class), any(GeneratedKeyHolder.class));
        verify(jdbcTemplate).queryForObject(anyString(), any(RowMapper.class), eq(1L), eq(99L));
    }

    @Test
    void updateProductFiltersByTenantId() {
        when(jdbcTemplate.update(anyString(), any(Object[].class))).thenReturn(1);
        when(jdbcTemplate.queryForObject(anyString(), any(RowMapper.class), eq(1L), eq(99L))).thenReturn(product());

        // UpdateProductCommand: tenantId, productId, name, slug, description, price, category,
        //   demoUrl, dockerImage, status, features, techStack, videoUrl, screenshots,
        //   deploymentTemplate, repositoryInfo  (16 fields)
        productService.updateProduct(new UpdateProductCommand(
                1L,
                99L,
                "Dental AI Pro",
                "dental-ai-pro",
                "Updated clinic automation",
                BigDecimal.valueOf(7999),
                "CHATBOT",
                "https://demo.elevora.ai",
                "ghcr.io/elevora/dental-ai:latest",
                "ACTIVE",
                null,
                null,
                null,
                null,
                null,
                null));

        ArgumentCaptor<String> sql = ArgumentCaptor.forClass(String.class);
        verify(jdbcTemplate).update(sql.capture(), any(Object[].class));
        assertEquals(true, sql.getValue().contains("WHERE tenant_id = ? AND id = ?"));
    }

    @Test
    void deleteProductSoftDeletesWithinTenant() {
        when(jdbcTemplate.update(anyString(), eq(1L), eq(99L))).thenReturn(1);

        productService.deleteProduct(1L, 99L);

        ArgumentCaptor<String> sql = ArgumentCaptor.forClass(String.class);
        verify(jdbcTemplate).update(sql.capture(), eq(1L), eq(99L));
        assertEquals("UPDATE products SET status = 'ARCHIVED' WHERE tenant_id = ? AND id = ?", sql.getValue());
    }

    @Test
    void invalidInputThrowsValidationError() {
        // slug "bad slug" has a space — will fail the slug regex check
        CreateProductCommand invalid = new CreateProductCommand(
                1L,
                "",
                "bad slug",
                "Invalid",
                BigDecimal.valueOf(-1),
                "UNKNOWN",
                null,
                null,
                "ACTIVE",
                null,
                null,
                null,
                null,
                null,
                null);

        assertThrows(ResponseStatusException.class, () -> productService.createProduct(invalid));
    }

    // ProductResponse: id, tenantId, name, slug, description, price, category,
    //   demoUrl, dockerImage, status, features, techStack, videoUrl, screenshots,
    //   deploymentTemplate, repositoryInfo, createdAt  (17 fields)
    private ProductResponse product() {
        return new ProductResponse(
                99L,
                1L,
                "Dental AI",
                "dental-ai",
                "Clinic automation",
                BigDecimal.valueOf(4999),
                "CHATBOT",
                "https://demo.elevora.ai",
                "ghcr.io/elevora/dental-ai:latest",
                "ACTIVE",
                null,
                null,
                null,
                null,
                null,
                null,
                Instant.now());
    }
}
