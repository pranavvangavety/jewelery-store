package com.jewelrystore.product.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class ProductImageRequest {

    @NotNull
    private Long variantId;

    @NotBlank
    private String url;

    private String altText;

    @NotNull
    private Integer displayOrder;

    private boolean isPrimary;
}
