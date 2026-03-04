package com.jewelrystore.order.dto.client;

import lombok.Data;

@Data
public class InventoryResponse {
    private Long variantId;
    private Integer quantity;
    private Integer reservedQuantity;
    private Integer availableQuantity;
}
