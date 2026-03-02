package com.jewelrystore.cart.dto;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class AddItemRequest {

    @NotNull
    private Long variantId;

    @Min(1)
    private int quantity;
}
