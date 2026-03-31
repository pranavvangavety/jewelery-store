package com.jewelrystore.product.controller;

import com.jewelrystore.product.dto.*;
import com.jewelrystore.product.entity.ProductStatus;
import com.jewelrystore.product.service.CategoryService;
import com.jewelrystore.product.service.ProductService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequiredArgsConstructor
public class ProductController {

    private final ProductService productService;
    private final CategoryService categoryService;


    //Category Endpoints

    @PostMapping("/categories") // ADMIN
    public ResponseEntity<CategoryResponse> createCategory(@Valid @RequestBody CategoryRequest request) {
        return ResponseEntity.ok(categoryService.createCategory(request));
    }

    @GetMapping("/categories")
    public ResponseEntity<List<CategoryResponse>> getAllCategories() {
        return ResponseEntity.ok(categoryService.getAllCategories());
    }

    @DeleteMapping("/categories/{id}") // ADMIN
    public ResponseEntity<Void> deleteCategory(@PathVariable Long id) {
        categoryService.deleteCategory(id);
        return ResponseEntity.noContent().build();
    }

    //Product Endpoints

    @PostMapping("/products") // ADMIN
    public ResponseEntity<ProductResponse> createProduct(@Valid @RequestBody ProductRequest request) {
        return ResponseEntity.ok(productService.createProduct(request));
    }


    @GetMapping("/products")
    public ResponseEntity<List<ProductResponse>> getAllActiveProducts(@RequestParam(required = false) Long categoryId) {
        if(categoryId != null) {
            return ResponseEntity.ok(productService.getProductByCategory(categoryId));
        }
        return ResponseEntity.ok(productService.getAllActiveProducts());
    }

    @GetMapping("/products/all") // ADMIN
    public ResponseEntity<List<ProductResponse>> getAllProducts() {
        return ResponseEntity.ok(productService.getAllProducts());
    }

    @GetMapping("/products/{id}")
    public ResponseEntity<ProductResponse> getProductsById(@PathVariable Long id) {
        return ResponseEntity.ok(productService.getProductById(id));
    }

    @GetMapping("/products/all/{id}") // ADMIN
    public ResponseEntity<ProductResponse> getProductByIdAdmin(@PathVariable Long id) {
        return ResponseEntity.ok(productService.getProductByIdAdmin(id));
    }

    @PutMapping("/products/{id}") //ADMIN
    public ResponseEntity<ProductResponse> updateProduct(@PathVariable Long id, @Valid @RequestBody ProductRequest request) {
        return ResponseEntity.ok(productService.updateProduct(id, request));
    }

    @PatchMapping("/products/{id}/status") // ADMIN
    public ResponseEntity<ProductResponse> updateStatus(@PathVariable Long id, @RequestParam ProductStatus status) {
        return ResponseEntity.ok(productService.updateStatus(id, status));
    }

    // Product variant endpoints

    @PostMapping("/products/{id}/variants") // ADMIN
    public ResponseEntity<ProductResponse> addVariant(@PathVariable Long id, @Valid @RequestBody ProductVariantRequest request) {
        return ResponseEntity.ok(productService.addVariant(id, request));
    }

    @PutMapping("/products/{id}/variants/{variantId}") // ADMIN
    public ResponseEntity<ProductResponse> updateVariant(
            @PathVariable Long id,
            @PathVariable Long variantId,
            @Valid @RequestBody ProductVariantRequest request) {
        return ResponseEntity.ok(productService.updateVariant(id, variantId, request));
    }

    @DeleteMapping("/products/{id}/variants/{variantId}") // ADMIN
    public ResponseEntity<Void> deleteVariant(@PathVariable Long id, @PathVariable Long variantId) {
        productService.deleteVariant(id, variantId);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/products/variants/{variantId}/details")
    public ResponseEntity<ProductVariantResponse> getVariantDetails(@PathVariable Long variantId) {
        return ResponseEntity.ok(productService.getVariantDetails(variantId));
    }


    // Image Endpoints

    @PostMapping("/products/{id}/images") //ADMIN
    public ResponseEntity<ProductResponse> addImage(@PathVariable Long id, @Valid @RequestBody ProductImageRequest request) {
        return ResponseEntity.ok(productService.addImage(id, request));
    }

    @DeleteMapping("/products/{id}/images/{imageId}") //ADMIN
    public ResponseEntity<ProductResponse> deleteImage(@PathVariable Long id, @PathVariable Long imageId) {
        return ResponseEntity.ok(productService.deleteImage(id, imageId));
    }

    @PatchMapping("/products/{id}/images/{imageId}/primary") // ADMIN
    public ResponseEntity<ProductResponse> setPrimaryImage(
            @PathVariable Long id, @PathVariable Long imageId) {
        return ResponseEntity.ok(productService.setPrimaryImage(id, imageId));
    }
}
