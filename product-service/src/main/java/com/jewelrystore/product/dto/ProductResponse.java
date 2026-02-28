package com.jewelrystore.product.dto;

import com.jewelrystore.product.entity.Material;
import com.jewelrystore.product.entity.ProductImage;
import com.jewelrystore.product.entity.ProductStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ProductResponse {
    private Long id;
    private String name;
    private String description;
    private Material material;
    private CategoryResponse category;
    private ProductStatus status;
    private List<ProductImageResponse> images;
    private List<ProductVariantRequest> variants;
}
