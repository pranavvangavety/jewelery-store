package com.jewelrystore.product.service;

import com.jewelrystore.product.dto.*;
import com.jewelrystore.product.entity.Category;
import com.jewelrystore.product.entity.Product;
import com.jewelrystore.product.entity.ProductStatus;
import com.jewelrystore.product.entity.ProductVariant;
import com.jewelrystore.product.repository.CategoryRepository;
import com.jewelrystore.product.repository.ProductRepository;
import com.jewelrystore.product.repository.ProductVariantRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class ProductService {

    private final ProductRepository productRepository;
    private final ProductVariantRepository productVariantRepository;
    private final CategoryRepository categoryRepository;

    @Transactional
    public ProductResponse createProduct(ProductRequest request) {
        Category category = categoryRepository.findById(request.getCategoryId())
                .orElseThrow(() -> new RuntimeException("Category not found with id: " + request.getCategoryId()));

        for (ProductVariantRequest variantRequest : request.getVariants()) {
            if(productVariantRepository.existsBySku(variantRequest.getSku())){
                throw new RuntimeException("SKU already exists: " + variantRequest.getSku());
            }
        }

        Product product = Product.builder()
                .name(request.getName())
                .description(request.getDescription())
                .material(request.getMaterial())
                .category(category)
                .status(ProductStatus.DRAFT)
                .build();

        Product saved = productRepository.save(product);

        List<ProductVariant> variants  =request.getVariants().stream()
                .map(v -> ProductVariant.builder()
                        .product(saved)
                        .sku(v.getSku())
                        .price(v.getPrice())
                        .color(v.getColor())
                        .size(v.getSize())
                        .build())
                .toList();


        saved.getVariants().addAll(productVariantRepository.saveAll(variants));
        log.info("Created product: {}", saved.getName());
        return mapToResponse(saved);
    }


    @Transactional(readOnly = true)
    public List<ProductResponse> getAllActiveProducts() {
        return productRepository.findByStatus(ProductStatus.ACTIVE)
                .stream().map(this::mapToResponse)
                .toList();
    }


    @Transactional(readOnly = true)
    public List<ProductResponse> getProductByCategory(Long categoryId) {
        return productRepository.findByCategoryIdAndStatus(categoryId, ProductStatus.ACTIVE)
                .stream().map(this::mapToResponse).toList();
    }


    @Transactional(readOnly = true)
    public ProductResponse getProductById(Long id) {
        Product product = productRepository.findByIdAndStatus(id, ProductStatus.ACTIVE)
                .orElseThrow(() -> new RuntimeException("Product not found with id: " + id));
        return mapToResponse(product);
    }


    @Transactional
    public ProductResponse updateProduct(Long id, ProductRequest request) {
        Product product = productRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Product not found with id: " + id));
        Category category = categoryRepository.findById(request.getCategoryId())
                .orElseThrow(() -> new RuntimeException("Category not found with id: " + id));

        product.setName(request.getName());
        product.setDescription(request.getDescription());
        product.setMaterial(request.getMaterial());
        product.setCategory(category);

        productRepository.save(product);
        log.info("Updated product: {}", product.getName());
        return mapToResponse(product);
    }


    @Transactional
    public ProductResponse updateStatus(Long id, ProductStatus status) {
        Product product = productRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Product not found with id: " + id));

        product.setStatus(status);
        productRepository.save(product);
        log.info("Updated status to {} for product: {}", status, product.getStatus());
        return mapToResponse(product);
    }


    @Transactional
    public ProductResponse addVariant(Long productId, ProductVariantRequest request) {
        Product product = productRepository.findById(productId)
                .orElseThrow(() -> new RuntimeException("Product not found with id: " + productId));

        if(productVariantRepository.existsBySku(request.getSku())) {
            throw new RuntimeException("SKU already exists: " + request.getSku());
        }

        ProductVariant variant = ProductVariant.builder()
                .product(product)
                .sku(request.getSku())
                .price(request.getPrice())
                .color(request.getColor())
                .size(request.getSize())
                .build();

        product.getVariants().add(productVariantRepository.save(variant));
        productRepository.save(product);
        return mapToResponse(product);
    }


    @Transactional
    public void deleteVariant(Long productId, Long variantId) {
        Product product = productRepository.findById(productId)
                .orElseThrow(() -> new RuntimeException("Product not found with id: " + productId));

        ProductVariant variant = product.getVariants().stream()
                .filter(v -> v.getId().equals(variantId))
                .findFirst()
                .orElseThrow(() -> new RuntimeException("Variant not found with id: " + variantId));

        if (product.getVariants().size() == 1) {
            throw new RuntimeException("Cannot delete the only variant of a product");
        }

        product.getVariants().remove(variant);
        productRepository.save(product);
        log.info("Deleted variant {} from product {}", variantId, productId);
    }



    private ProductResponse mapToResponse(Product product) {
        List<ProductVariantResponse> variants = product.getVariants().stream()
                .map(v -> ProductVariantResponse.builder()
                        .id(v.getId())
                        .sku(v.getSku())
                        .price(v.getPrice())
                        .color(v.getColor())
                        .size(v.getSize())
                        .build())
                .toList();


        List<ProductImageResponse> images = product.getImages().stream()
                .map(i -> ProductImageResponse.builder()
                        .id(i.getId())
                        .url(i.getUrl())
                        .altText(i.getAltText())
                        .displayOrder(i.getDisplayOrder())
                        .isPrimary(i.isPrimary())
                        .build())
                .toList();


        return ProductResponse.builder()
                .id(product.getId())
                .name(product.getName())
                .description(product.getDescription())
                .material(product.getMaterial())
                .category(
                        CategoryResponse.builder()
                                .id(product.getCategory().getId())
                                .name(product.getCategory().getName())
                                .slug(product.getCategory().getSlug())
                                .build()
                )
                .status(product.getStatus())
                .images(images)
                .variants(variants)
                .build();
    }

}
