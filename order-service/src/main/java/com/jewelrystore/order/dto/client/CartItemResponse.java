package com.jewelrystore.order.dto.client;

import lombok.Data;

import java.math.BigDecimal;

@Data
public class CartItemResponse {
    private Long variantId;
    private String productName;
    private String sku;
    private String color;
    private String size;
    private String imageUrl;
    private BigDecimal price;
    private Integer quantity;
}
