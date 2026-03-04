package com.jewelrystore.cart.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.jewelrystore.cart.dto.*;
import com.jewelrystore.cart.dto.client.InventoryResponse;
import com.jewelrystore.cart.dto.client.ProductVariantResponse;
import com.jewelrystore.cart.model.Cart;
import com.jewelrystore.cart.model.CartItem;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;
import java.util.concurrent.TimeUnit;

@Service
@RequiredArgsConstructor
@Slf4j
public class CartService {

    private final RedisTemplate<String, Object> redisTemplate;
    private final ObjectMapper objectMapper;

    @Qualifier("inventoryClient")
    private final RestClient inventoryClient;

    @Qualifier("productClient")
    private final RestClient productClient;

    @Value("${cart.ttl.guest}")
    private long guestTtl;

    @Value("${cart.ttl.user}")
    private long userTtl;

    private static final String GUEST_PREFIX = "cart:guest:";
    private static final String USER_PREFIX = "cart:user:";

    public CartResponse getCart(String cartKey) {
        Cart cart = getCartFromRedis(cartKey);
        if(cart == null) {
            return CartResponse.builder()
                    .items(List.of())
                    .totalItems(0)
                    .totalPrice(BigDecimal.ZERO)
                    .build();
        }
        return mapToResponse(cart);
    }

    public CartResponse addItem(String cartKey, AddItemRequest request) {
        InventoryResponse inventory = getInventory(request.getVariantId());

        if(inventory == null) {
            throw new RuntimeException("Insufficient stock for variantId: " + request.getVariantId());
        }

        Cart cart = getCartFromRedis(cartKey);
        if(cart == null) {
            cart = Cart.builder()
                    .cartKey(cartKey)
                    .items(new ArrayList<>()).build();
        }

        CartItem existingItem = cart.getItems().stream()
                .filter(i -> i.getVariantId().equals(request.getVariantId()))
                .findFirst()
                .orElse(null);

        int existingQuantity = existingItem != null ? existingItem.getQuantity() : 0;

        if(existingQuantity + request.getQuantity() > inventory.getAvailableQuantity()) {
            throw new RuntimeException("Insufficient stock for variantId: " + request.getVariantId());
        }

        ProductVariantResponse variant = productClient.get()
                .uri("/products/variants/" + request.getVariantId() + "/details")
                .retrieve()
                .body(ProductVariantResponse.class);

        if(variant == null){
            throw new RuntimeException("Product not found for variantId: " +  request.getVariantId());
        }


        if(existingItem != null) {
            existingItem.setQuantity(existingItem.getQuantity() + request.getQuantity());
        } else {
            String imageUrl = variant.getPrimaryImage() != null ? variant.getPrimaryImage().getUrl() : null;

            CartItem newItem = CartItem.builder()
                    .variantId(request.getVariantId())
                    .productName(variant.getProductName())
                    .color(variant.getColor())
                    .size(variant.getSize())
                    .price(variant.getPrice())
                    .imageUrl(imageUrl)
                    .quantity(request.getQuantity())
                    .build();

            cart.getItems().add(newItem);
        }

        saveCartToRedis(cart, cartKey);
        log.info("Added item {} to cart {}", request.getVariantId(), cartKey);
        return mapToResponse(cart);
    }

    public CartResponse updateItem(String cartKey, Long variantId, UpdateItemRequest request) {
        Cart cart = getCartFromRedis(cartKey);
        if(cart == null) {
            throw new RuntimeException("Cart not found for key: " + cartKey);
        }

        CartItem item = cart.getItems().stream()
                .filter(i -> i.getVariantId().equals(variantId))
                .findFirst()
                .orElseThrow(() -> new RuntimeException("Item not found in cart for variantId: " + variantId));

        InventoryResponse inventory = getInventory(variantId);
        if(inventory == null || request.getQuantity() > inventory.getAvailableQuantity()) {
            throw new RuntimeException("Insufficient stock for variantId: " + variantId);
        }
        item.setQuantity(request.getQuantity());
        saveCartToRedis(cart, cartKey);
        log.info("Updated item {} in cart {}", variantId, cartKey);
        return mapToResponse(cart);
    }

    public CartResponse removeItem(String cartKey, Long variantId) {
        Cart cart = getCartFromRedis(cartKey);
        if(cart == null) {
            throw new RuntimeException("Cart not found for key: " + cartKey);
        }

        cart.getItems().removeIf(i -> i.getVariantId().equals(variantId));
        saveCartToRedis(cart, cartKey);
        log.info("Removed item {} from cart {}", variantId, cartKey);
        return mapToResponse(cart);
    }

    public void clearCart(String cartKey) {
        redisTemplate.delete(cartKey);
        log.info("Cleared cart {}", cartKey);
    }

    public CartResponse mergeCart(String userCartKey, String guestSessionId) {
        String guestCartKey = GUEST_PREFIX + guestSessionId;

        Cart guestCart = getCartFromRedis(guestCartKey);
        Cart userCart = getCartFromRedis(userCartKey);

        if(guestCart==null || guestCart.getItems().isEmpty()) {
            return userCart != null ? mapToResponse(userCart) : CartResponse.builder()
                    .items(List.of())
                    .totalItems(0)
                    .totalPrice(BigDecimal.ZERO)
                    .build();
        }

        if(userCart == null) {
            userCart = Cart.builder()
                    .cartKey(userCartKey)
                    .items(new ArrayList<>())
                    .build();
        }

        for(CartItem guestItem : guestCart.getItems()) {

            InventoryResponse inventory = getInventory(guestItem.getVariantId());

            if(inventory == null || inventory.getAvailableQuantity() == 0) {
                log.warn("Skipping variantId {} during merge - out of stock", guestItem.getVariantId());
                continue;
            }

            CartItem existingItem = userCart.getItems().stream().filter(i -> i.getVariantId().equals(guestItem.getVariantId()))
                    .findFirst().orElse(null);

            if(existingItem != null) {
                int mergedQuantity = existingItem.getQuantity() + guestItem.getQuantity();
                existingItem.setQuantity(Math.min(mergedQuantity, inventory.getAvailableQuantity()));
            } else{
                guestItem.setQuantity(Math.min(guestItem.getQuantity(), inventory.getAvailableQuantity()));
                userCart.getItems().add(guestItem);
            }
        }

        saveCartToRedis(userCart, userCartKey);
        redisTemplate.delete(guestCartKey);
        log.info("Merged guest cart {} into user cart {}", guestCartKey, userCartKey);
        return mapToResponse(userCart);
    }


    //Helpers

    private Cart getCartFromRedis(String cartKey) {
        Object value = redisTemplate.opsForValue().get(cartKey);
        if(value == null){
            return null;
        }

        return objectMapper.convertValue(value, Cart.class);
    }

    private void saveCartToRedis(Cart cart, String cartKey) {
        long ttl = cartKey.startsWith(GUEST_PREFIX) ? guestTtl : userTtl;
        redisTemplate.opsForValue().set(cartKey, cart, ttl, TimeUnit.SECONDS);
    }


    private InventoryResponse getInventory(Long variantId) {
        return inventoryClient.get()
                .uri("/inventory/" + variantId)
                .retrieve()
                .body(InventoryResponse.class);
    }


    private CartResponse mapToResponse(Cart cart) {
        List<CartItemResponse> items = cart.getItems().stream()
                .map(item -> CartItemResponse.builder()
                        .variantId(item.getVariantId())
                        .productName(item.getProductName())
                        .color(item.getColor())
                        .size(item.getSize())
                        .price(item.getPrice())
                        .imageUrl(item.getImageUrl())
                        .quantity(item.getQuantity())
                        .itemTotal(item.getPrice().multiply(BigDecimal.valueOf(item.getQuantity())))
                        .build()
                ).toList();

        return CartResponse.builder()
                .items(items)
                .totalItems(cart.getTotalItems())
                .totalPrice(cart.getTotalPrice())
                .build();
    }
}
