package com.jewelrystore.order.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class OrderItemResponse {
    private Long variantId;
    private String productName;
    private String sku;
    private String color;
    private String size;
    private String imageUrl;
    private BigDecimal price;
    private Integer quantity;
    private BigDecimal itemTotal;
}
