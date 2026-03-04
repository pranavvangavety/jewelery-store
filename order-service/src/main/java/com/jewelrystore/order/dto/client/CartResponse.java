package com.jewelrystore.order.dto.client;

import lombok.Data;

import java.math.BigDecimal;
import java.util.List;

@Data
public class CartResponse {
    private List<CartItemResponse> items;
    private Integer totalItems;
    private BigDecimal totalPrice;
}
