package com.jewelrystore.payment.controller;

import lombok.Data;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.math.BigDecimal;
import java.util.UUID;

@RestController
@RequestMapping("/payments")
public class PaymentController {

    @PostMapping
    public PaymentResponse processPayment(@RequestBody PaymentRequest request) {
        // Mock — always returns success with a fake transaction ID
        return new PaymentResponse("SUCCESS", "txn_" + UUID.randomUUID().toString().replace("-", "").substring(0, 12));
    }

    @Data
    static class PaymentRequest {
        private Long orderId;
        private BigDecimal amount;
        private String email;
    }

    @Data
    static class PaymentResponse {
        private final String status;
        private final String transactionId;
    }
}