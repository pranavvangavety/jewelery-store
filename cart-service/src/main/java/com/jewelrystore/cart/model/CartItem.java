package com.jewelrystore.cart.model;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CartItem {

    private Long variantId;
    private String productName;
    private String color;
    private String size;
    private BigDecimal price;
    private String imageUrl;
    private int quantity;

}
