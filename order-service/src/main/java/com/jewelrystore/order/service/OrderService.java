package com.jewelrystore.order.service;

import com.jewelrystore.order.dto.*;
import com.jewelrystore.order.dto.client.*;
import com.jewelrystore.order.entity.*;
import com.jewelrystore.order.exception.InvalidOperationException;
import com.jewelrystore.order.exception.ResourceNotFoundException;
import com.jewelrystore.order.repository.OrderRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.client.RestClient;

import java.math.BigDecimal;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class OrderService {

    private final OrderRepository orderRepository;
    private final KafkaTemplate<String, Object> kafkaTemplate;

    @Qualifier("cartClient")
    private final RestClient cartClient;

    @Qualifier("userClient")
    private final RestClient userClient;

    @Qualifier("inventoryClient")
    private final RestClient inventoryClient;

    @Qualifier("paymentClient")
    private final RestClient paymentClient;

    @Transactional
    public OrderResponse placeOrder(PlaceOrderRequest request, Long userId, String sessionId) {

        CartResponse cart = fetchCart(userId, sessionId);

        if (cart == null || cart.getItems().isEmpty()) {
            throw new ResourceNotFoundException("Cart is empty or not found");
        }

        String street, city, state, zipCode, country;

        if (request.getAddressId() != null) {
            AddressResponse address = userClient.get()
                    .uri("/users/addresses/" + request.getAddressId())
                    .retrieve()
                    .body(AddressResponse.class);

            if (address == null) {
                throw new ResourceNotFoundException("Address not found: " + request.getAddressId());
            }

            street = address.getStreet();
            city = address.getCity();
            state = address.getState();
            zipCode = address.getZipCode();
            country = address.getCountry();
        } else {
            street = request.getShippingStreet();
            city = request.getShippingCity();
            state = request.getShippingState();
            zipCode = request.getShippingZipCode();
            country = request.getShippingCountry();
        }

        for (CartItemResponse item : cart.getItems()) {
            inventoryClient.post()
                    .uri("/inventory/" + item.getVariantId() + "/reserve")
                    .body(new ReservationRequest(item.getQuantity()))
                    .retrieve()
                    .toBodilessEntity();
        }

        BigDecimal total = cart.getItems().stream()
                .map(item -> item.getPrice().multiply(BigDecimal.valueOf(item.getQuantity())))
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        List<OrderItem> orderItems = cart.getItems().stream()
                .map(item -> OrderItem.builder()
                        .variantId(item.getVariantId())
                        .productName(item.getProductName())
                        .sku(item.getSku())
                        .color(item.getColor())
                        .size(item.getSize())
                        .imageUrl(item.getImageUrl())
                        .price(item.getPrice())
                        .quantity(item.getQuantity())
                        .build())
                .collect(Collectors.toList());

        Order order = Order.builder()
                .userId(userId)
                .firstName(request.getFirstName())
                .lastName(request.getLastName())
                .email(request.getEmail())
                .phone(request.getPhone())
                .shippingStreet(street)
                .shippingCity(city)
                .shippingState(state)
                .shippingZip(zipCode)
                .shippingCountry(country)
                .orderStatus(OrderStatus.PENDING_PAYMENT)
                .paymentStatus(PaymentStatus.PENDING)
                .totalAmount(total)
                .items(orderItems)
                .build();

        orderItems.forEach(item -> item.setOrder(order));
        Order savedOrder = orderRepository.save(order);

        clearCart(userId, sessionId);

        PaymentResponse payment = paymentClient.post()
                .uri("/payments")
                .body(PaymentRequest.builder()
                        .orderId(savedOrder.getId())
                        .amount(total)
                        .email(request.getEmail())
                        .build())
                .retrieve()
                .body(PaymentResponse.class);

        if (payment != null && "SUCCESS".equals(payment.getStatus())) {
            savedOrder.setOrderStatus(OrderStatus.CONFIRMED);
            savedOrder.setPaymentStatus(PaymentStatus.PAID);
            savedOrder.setTransactionId(payment.getTransactionId());

            for (CartItemResponse item : cart.getItems()) {
                inventoryClient.post()
                        .uri("/inventory/" + item.getVariantId() + "/confirm")
                        .body(new ReservationRequest(item.getQuantity()))
                        .retrieve()
                        .toBodilessEntity();
            }

            kafkaTemplate.send("order-placed", String.valueOf(savedOrder.getId()), mapToResponse(savedOrder));
            log.info("Order {} placed successfully", savedOrder.getId());

        } else {
            savedOrder.setOrderStatus(OrderStatus.FAILED);
            savedOrder.setPaymentStatus(PaymentStatus.FAILED);

            for (CartItemResponse item : cart.getItems()) {
                inventoryClient.post()
                        .uri("/inventory/" + item.getVariantId() + "/release")
                        .body(new ReservationRequest(item.getQuantity()))
                        .retrieve()
                        .toBodilessEntity();
            }

            log.warn("Order {} payment failed", savedOrder.getId());
        }

        orderRepository.save(savedOrder);
        return mapToResponse(savedOrder);
    }

    public OrderResponse getOrder(Long orderId) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new ResourceNotFoundException("Order not found: " + orderId));
        return mapToResponse(order);
    }

    public List<OrderResponse> getOrdersByUser(Long userId) {
        return orderRepository.findByUserId(userId)
                .stream().map(this::mapToResponse).toList();
    }

    private CartResponse fetchCart(Long userId, String sessionId) {
        if (userId != null) {
            return cartClient.get()
                    .uri("/cart")
                    .header("X-User-Id", userId.toString())
                    .retrieve()
                    .body(CartResponse.class);
        } else if (sessionId != null) {
            return cartClient.get()
                    .uri("/cart")
                    .header("X-Session-Id", sessionId)
                    .retrieve()
                    .body(CartResponse.class);
        } else {
            throw new InvalidOperationException("No identity provided - supply X-User-Id or X-Session-Id");
        }
    }

    private void clearCart(Long userId, String sessionId) {
        if (userId != null) {
            cartClient.delete()
                    .uri("/cart")
                    .header("X-User-Id", userId.toString())
                    .retrieve()
                    .toBodilessEntity();
        } else {
            cartClient.delete()
                    .uri("/cart")
                    .header("X-Session-Id", sessionId)
                    .retrieve()
                    .toBodilessEntity();
        }
    }

    private OrderResponse mapToResponse(Order order) {
        List<OrderItemResponse> items = order.getItems().stream()
                .map(item -> OrderItemResponse.builder()
                        .variantId(item.getVariantId())
                        .productName(item.getProductName())
                        .sku(item.getSku())
                        .color(item.getColor())
                        .size(item.getSize())
                        .imageUrl(item.getImageUrl())
                        .price(item.getPrice())
                        .quantity(item.getQuantity())
                        .itemTotal(item.getPrice().multiply(BigDecimal.valueOf(item.getQuantity())))
                        .build())
                .collect(Collectors.toList());

        return OrderResponse.builder()
                .id(order.getId())
                .userId(order.getUserId())
                .firstName(order.getFirstName())
                .lastName(order.getLastName())
                .email(order.getEmail())
                .phone(order.getPhone())
                .shippingStreet(order.getShippingStreet())
                .shippingCity(order.getShippingCity())
                .shippingState(order.getShippingState())
                .shippingZipCode(order.getShippingZip())
                .shippingCountry(order.getShippingCountry())
                .orderStatus(order.getOrderStatus())
                .paymentStatus(order.getPaymentStatus())
                .totalAmount(order.getTotalAmount())
                .transactionId(order.getTransactionId())
                .items(items)
                .createdAt(order.getCreatedAt())
                .updatedAt(order.getUpdatedAt())
                .build();
    }
}