package com.jewelrystore.order.dto.client;

import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;

@Data
@Builder
public class PaymentRequest {
    private Long orderId;
    private BigDecimal amount;
    private String email;
}
