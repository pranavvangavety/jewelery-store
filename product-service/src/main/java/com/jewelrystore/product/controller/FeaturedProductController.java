package com.jewelrystore.product.controller;

import com.jewelrystore.product.dto.ProductResponse;
import com.jewelrystore.product.service.FeaturedProductService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequiredArgsConstructor
public class FeaturedProductController {

    private final FeaturedProductService featuredProductService;

    @GetMapping("/featured")
    public ResponseEntity<List<ProductResponse>> getFeatured(){
        return ResponseEntity.ok(featuredProductService.getFeaturedProducts());
    }

    @PostMapping("/featured/{productId}")
    public ResponseEntity<Void> addFeatured(@PathVariable Long productId){
        featuredProductService.addFeaturedProduct(productId);
        return ResponseEntity.noContent().build();
    }

    @DeleteMapping("/featured/{productId}")
    public ResponseEntity<Void> removeFeatured(@PathVariable Long productId) {
        featuredProductService.removeFeaturedProduct(productId);
        return ResponseEntity.noContent().build();
    }
}
