package com.jewelrystore.cart.controller;

import com.jewelrystore.cart.dto.*;
import com.jewelrystore.cart.security.JwtUtil;
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
    private final JwtUtil jwtUtil;

    @GetMapping
    public ResponseEntity<CartResponse> getCart(
            @RequestHeader(value = "Authorization", required = false) String authHeader,
            @RequestHeader(value = "X-Session-Id", required = false) String sessionId) {
        String cartKey = resolveCartKey(authHeader, sessionId);
        return ResponseEntity.ok(cartService.getCart(cartKey));
    }

    @PostMapping("/items")
    public ResponseEntity<CartResponse> addItem(
            @RequestHeader(value = "Authorization", required = false) String authHeader,
            @RequestHeader(value = "X-Session-Id", required = false) String sessionId,
            @Valid @RequestBody AddItemRequest request) {
        String cartKey = resolveCartKey(authHeader, sessionId);
        return ResponseEntity.ok(cartService.addItem(cartKey, request));
    }

    @PutMapping("/items/{variantId}")
    public ResponseEntity<CartResponse> updateItem(
            @RequestHeader(value = "Authorization", required = false) String authHeader,
            @RequestHeader(value = "X-Session-Id", required = false) String sessionId,
            @PathVariable Long variantId,
            @Valid @RequestBody UpdateItemRequest request) {
        String cartKey = resolveCartKey(authHeader, sessionId);
        return ResponseEntity.ok(cartService.updateItem(cartKey, variantId, request));
    }

    @DeleteMapping("/items/{variantId}")
    public ResponseEntity<CartResponse> removeItem(
            @RequestHeader(value = "Authorization", required = false) String authHeader,
            @RequestHeader(value = "X-Session-Id", required = false) String sessionId,
            @PathVariable Long variantId) {
        String cartKey = resolveCartKey(authHeader, sessionId);
        return ResponseEntity.ok(cartService.removeItem(cartKey, variantId));
    }

    @DeleteMapping
    public ResponseEntity<Void> clearCart(
            @RequestHeader(value = "Authorization", required = false) String authHeader,
            @RequestHeader(value = "X-Session-Id", required = false) String sessionId) {
        String cartKey = resolveCartKey(authHeader, sessionId);
        cartService.clearCart(cartKey);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/merge")
    public ResponseEntity<CartResponse> mergeCart(
            @RequestHeader(value = "Authorization") String authHeader,
            @Valid @RequestBody MergeCartRequest request) {
        if (!jwtUtil.validateToken(extractToken(authHeader))) {
            throw new RuntimeException("Invalid token");
        }
        Long userId = jwtUtil.extractUserId(extractToken(authHeader));
        String userCartKey = "cart:user:" + userId;
        return ResponseEntity.ok(cartService.mergeCart(userCartKey, request.getGuestSessionId()));
    }

    // helpers

    private String resolveCartKey(String authHeader, String sessionId) {
        if (authHeader != null && authHeader.startsWith("Bearer ")) {
            String token = extractToken(authHeader);
            if (!jwtUtil.validateToken(token)) {
                throw new RuntimeException("Invalid token");
            }
            Long userId = jwtUtil.extractUserId(token);
            return "cart:user:" + userId;
        } else if (sessionId != null && !sessionId.isBlank()) {
            return "cart:guest:" + sessionId;
        } else {
            throw new RuntimeException("No identity provided - supply Authorization header or X-Session-Id");
        }
    }

    private String extractToken(String authHeader) {
        return authHeader.substring(7);
    }
}