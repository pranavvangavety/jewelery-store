package com.jewelrystore.product.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ProductVariantResponse {
    private Long id;
    private String sku;
    private BigDecimal price;
    private String color;
    private String size;
    private List<ProductImageResponse> images;
    private String productName;
    private ProductImageResponse primaryImage;
}
