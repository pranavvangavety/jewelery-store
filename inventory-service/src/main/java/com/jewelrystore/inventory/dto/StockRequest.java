package com.jewelrystore.inventory.dto;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class StockRequest {

    @NotNull
    private Long variantId;

    @NotNull
    @Min(0)
    private Integer quantity;
}
