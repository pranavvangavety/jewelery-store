package com.jewelrystore.product.dto;

import com.jewelrystore.product.entity.Material;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Data;

import java.util.List;

@Data
public class ProductRequest {

    @NotBlank
    private String name;

    private String description;

    @NotNull
    private Material material;

    @NotNull
    private Long categoryId;

    @NotNull
    @Size(min = 1, message = "At least one variant is required")
    private List<ProductVariantRequest> variants;
}
