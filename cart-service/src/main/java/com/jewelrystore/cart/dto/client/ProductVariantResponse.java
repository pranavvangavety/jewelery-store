package com.jewelrystore.cart.dto.client;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class ProductVariantResponse {

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class PrimaryImage{
        private String url;
        private String altText;
    }

    private Long id;
    private String productName;
    private String color;
    private String size;
    private BigDecimal price;
    private PrimaryImage primaryImage;
}
