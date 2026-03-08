package com.jewelrystore.cart.controller;

import com.jewelrystore.cart.dto.*;
import com.jewelrystore.cart.service.CartService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/cart")
@RequiredArgsConstructor
public class CartController {

    private final CartService cartService;

    @GetMapping
    public ResponseEntity<CartResponse> getCart(
            @RequestHeader(value = "X-User-Id", required = false) String xUserId,
            @RequestHeader(value = "X-Session-Id", required = false) String sessionId) {
        String cartKey = resolveCartKey(xUserId, sessionId);
        return ResponseEntity.ok(cartService.getCart(cartKey));
    }

    @PostMapping("/items")
    public ResponseEntity<CartResponse> addItem(
            @RequestHeader(value = "X-User-Id", required = false) String xUserId,
            @RequestHeader(value = "X-Session-Id", required = false) String sessionId,
            @Valid @RequestBody AddItemRequest request) {
        String cartKey = resolveCartKey(xUserId, sessionId);
        return ResponseEntity.ok(cartService.addItem(cartKey, request));
    }

    @PutMapping("/items/{variantId}")
    public ResponseEntity<CartResponse> updateItem(
            @RequestHeader(value = "X-User-Id", required = false) String xUserId,
            @RequestHeader(value = "X-Session-Id", required = false) String sessionId,
            @PathVariable Long variantId,
            @Valid @RequestBody UpdateItemRequest request) {
        String cartKey = resolveCartKey(xUserId, sessionId);
        return ResponseEntity.ok(cartService.updateItem(cartKey, variantId, request));
    }

    @DeleteMapping("/items/{variantId}")
    public ResponseEntity<CartResponse> removeItem(
            @RequestHeader(value = "X-User-Id", required = false) String xUserId,
            @RequestHeader(value = "X-Session-Id", required = false) String sessionId,
            @PathVariable Long variantId) {
        String cartKey = resolveCartKey(xUserId, sessionId);
        return ResponseEntity.ok(cartService.removeItem(cartKey, variantId));
    }

    @DeleteMapping
    public ResponseEntity<Void> clearCart(
            @RequestHeader(value = "X-User-Id", required = false) String xUserId,
            @RequestHeader(value = "X-Session-Id", required = false) String sessionId) {
        String cartKey = resolveCartKey(xUserId, sessionId);
        cartService.clearCart(cartKey);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/merge")
    public ResponseEntity<CartResponse> mergeCart(
            @RequestHeader(value = "X-User-Id") String xUserId,
            @Valid @RequestBody MergeCartRequest request) {
        String userCartKey = "cart:user:" + xUserId;
        return ResponseEntity.ok(cartService.mergeCart(userCartKey, request.getGuestSessionId()));
    }

    // helpers

    private String resolveCartKey(String xUserId, String sessionId) {
        if(xUserId != null && !xUserId.isBlank()) {
            return "cart:user:" + xUserId;
        } else if (sessionId != null && !sessionId.isBlank()) {
            return "cart:guest:" + sessionId;
        } else {
            throw new RuntimeException("No identity provided - supply Authorization header or X-Session-Id");
        }
    }
}