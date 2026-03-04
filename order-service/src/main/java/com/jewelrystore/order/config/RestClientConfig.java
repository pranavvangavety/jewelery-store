package com.jewelrystore.order.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.client.RestClient;

@Configuration
public class RestClientConfig {
    @Value("${cart.service.url}")
    private String cartServiceUrl;

    @Value("${user.service.url}")
    private String userServiceUrl;

    @Value("${inventory.service.url}")
    private String inventoryServiceUrl;

    @Value("${payment.service.url}")
    private String paymentServiceUrl;

    @Bean("cartClient")
    public RestClient cartClient() {
        return RestClient.builder().baseUrl(cartServiceUrl).build();
    }

    @Bean("userClient")
    public RestClient userClient() {
        return RestClient.builder().baseUrl(userServiceUrl).build();
    }

    @Bean("inventoryClient")
    public RestClient inventoryClient() {
        return RestClient.builder().baseUrl(inventoryServiceUrl).build();
    }

    @Bean("paymentClient")
    public RestClient paymentClient() {
        return RestClient.builder().baseUrl(paymentServiceUrl).build();
    }
}
