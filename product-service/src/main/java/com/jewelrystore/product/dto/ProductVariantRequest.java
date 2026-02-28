package com.jewelrystore.product.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.math.BigDecimal;

@Data
public class ProductVariantRequest {

    @NotBlank
    private String sku;

    @NotNull
    @DecimalMin(value = "0.00")
    private BigDecimal price;

    private String color;

    private String size;
}
