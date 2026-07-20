package com.jewelrystore.product.service;

import com.jewelrystore.product.dto.ProductRequest;
import com.jewelrystore.product.dto.ProductVariantRequest;
import com.jewelrystore.product.entity.Category;
import com.jewelrystore.product.entity.Material;
import com.jewelrystore.product.entity.Product;
import com.jewelrystore.product.entity.ProductVariant;
import com.jewelrystore.product.event.VariantCreatedEvent;
import com.jewelrystore.product.exception.DuplicateResourceException;
import com.jewelrystore.product.messaging.TransactionalEventPublisher;
import com.jewelrystore.product.repository.CategoryRepository;
import com.jewelrystore.product.repository.ProductImageRepository;
import com.jewelrystore.product.repository.ProductRepository;
import com.jewelrystore.product.repository.ProductVariantRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class ProductServiceTest {

    @Mock
    private ProductRepository productRepository;

    @Mock
    private ProductVariantRepository productVariantRepository;

    @Mock
    private CategoryRepository categoryRepository;

    @Mock
    private ProductImageRepository productImageRepository;

    @Mock
    private TransactionalEventPublisher eventPublisher;

    @InjectMocks
    private ProductService productService;

    @Test
    void createProduct_publishesVariantCreatedEvent_perVariant() {
        ProductVariantRequest variantRequest = new ProductVariantRequest();
        variantRequest.setSku("SKU-1");
        variantRequest.setPrice(BigDecimal.TEN);
        variantRequest.setColor("Gold");
        variantRequest.setSize("M");

        ProductRequest request = new ProductRequest();
        request.setName("Ring");
        request.setDescription("A ring");
        request.setMaterial(Material.GOLD);
        request.setCategoryId(1L);
        request.setVariants(List.of(variantRequest));

        Category category = Category.builder()
                .id(1L)
                .name("Rings")
                .slug("rings")
                .build();

        when(categoryRepository.findById(1L)).thenReturn(Optional.of(category));
        when(productVariantRepository.existsBySku("SKU-1")).thenReturn(false);
        when(productRepository.save(any(Product.class))).thenAnswer(invocation -> {
            Product product = invocation.getArgument(0);
            product.setId(100L);
            return product;
        });
        when(productVariantRepository.saveAll(anyListOfVariants())).thenAnswer(invocation -> {
            List<ProductVariant> variants = invocation.getArgument(0);
            variants.forEach(v -> v.setId(10L));
            return variants;
        });

        productService.createProduct(request);

        verify(eventPublisher, times(1)).publishAfterCommit(eq("variant-created"), any(VariantCreatedEvent.class));
    }

    @Test
    void addVariant_publishesVariantCreatedEvent() {
        Category category = Category.builder()
                .id(1L)
                .name("Rings")
                .slug("rings")
                .build();

        Product product = Product.builder()
                .id(1L)
                .name("Ring")
                .material(Material.GOLD)
                .category(category)
                .variants(new ArrayList<>())
                .build();

        ProductVariantRequest request = new ProductVariantRequest();
        request.setSku("SKU-2");
        request.setPrice(BigDecimal.ONE);
        request.setColor("Silver");
        request.setSize("L");

        when(productRepository.findById(1L)).thenReturn(Optional.of(product));
        when(productVariantRepository.existsBySku("SKU-2")).thenReturn(false);
        when(productVariantRepository.save(any(ProductVariant.class))).thenAnswer(invocation -> {
            ProductVariant variant = invocation.getArgument(0);
            variant.setId(5L);
            return variant;
        });
        when(productRepository.save(any(Product.class))).thenAnswer(invocation -> invocation.getArgument(0));

        productService.addVariant(1L, request);

        verify(eventPublisher, times(1)).publishAfterCommit(eq("variant-created"), any(VariantCreatedEvent.class));
    }

    @Test
    void addVariant_whenSkuAlreadyExists_throwsDuplicateResourceException() {
        Category category = Category.builder()
                .id(1L)
                .name("Rings")
                .slug("rings")
                .build();

        Product product = Product.builder()
                .id(1L)
                .name("Ring")
                .material(Material.GOLD)
                .category(category)
                .variants(new ArrayList<>())
                .build();

        ProductVariantRequest request = new ProductVariantRequest();
        request.setSku("SKU-2");
        request.setPrice(BigDecimal.ONE);
        request.setColor("Silver");
        request.setSize("L");

        when(productRepository.findById(1L)).thenReturn(Optional.of(product));
        when(productVariantRepository.existsBySku("SKU-2")).thenReturn(true);

        assertThatThrownBy(() -> productService.addVariant(1L, request))
                .isInstanceOf(DuplicateResourceException.class);

        verifyNoInteractions(eventPublisher);
    }

    @SuppressWarnings("unchecked")
    private List<ProductVariant> anyListOfVariants() {
        return any(List.class);
    }
}
