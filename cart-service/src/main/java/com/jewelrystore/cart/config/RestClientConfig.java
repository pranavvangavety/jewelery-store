package com.jewelrystore.cart.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.client.RestClient;

@Configuration
public class RestClientConfig {

    @Value("${inventory.service.url}")
    private String inventoryServiceUrl;

    @Value("${product.service.url}")
    private String productServiceUrl;

    @Bean("inventoryClient")
    public RestClient inventoryClient() {
        return RestClient.builder().baseUrl(inventoryServiceUrl).build();
    }

    @Bean("productClient")
    public RestClient productClient() {
        return RestClient.builder().baseUrl(productServiceUrl).build();
    }
}
