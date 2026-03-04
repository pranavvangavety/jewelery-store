package com.jewelrystore.order.dto.client;

import lombok.Data;

@Data
public class PaymentResponse {
    private String status;
    private String transactionId;
}
