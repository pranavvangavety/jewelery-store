package com.jewelrystore.cart.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CartItemResponse {

    private Long variantId;
    private String productName;
    private String color;
    private String size;
    private BigDecimal price;
    private String imageUrl;
    private int quantity;
    private BigDecimal itemTotal;
}
