package com.jewelrystore.inventory.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class StockResponse {
    private Long variantId;
    private int quantity;
    private int reservedQuantity;
    private int availableQuantity;
}
