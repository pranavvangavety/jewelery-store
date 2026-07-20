package com.jewelrystore.order.service;

import com.jewelrystore.order.dto.PlaceOrderRequest;
import com.jewelrystore.order.dto.client.CartItemResponse;
import com.jewelrystore.order.dto.client.CartResponse;
import com.jewelrystore.order.dto.client.PaymentResponse;
import com.jewelrystore.order.entity.Order;
import com.jewelrystore.order.entity.OrderStatus;
import com.jewelrystore.order.entity.PaymentStatus;
import com.jewelrystore.order.exception.ResourceNotFoundException;
import com.jewelrystore.order.repository.OrderRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Answers;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.web.client.RestClient;

import java.math.BigDecimal;
import java.util.Collections;
import java.util.List;
import java.util.Optional;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@SuppressWarnings({"unchecked", "rawtypes"})
public class OrderServiceTest {
    @Mock private OrderRepository orderRepository;
    @Mock private KafkaTemplate<String, Object> kafkaTemplate;
    @Mock private RestClient cartClient;
    @Mock private RestClient userClient;
    @Mock(answer = Answers.RETURNS_DEEP_STUBS) private RestClient inventoryClient;
    @Mock(answer = Answers.RETURNS_DEEP_STUBS) private RestClient paymentClient;

    private OrderService orderService;

    @BeforeEach
    void setUp() {
        orderService = new OrderService(orderRepository, kafkaTemplate, cartClient, userClient, inventoryClient, paymentClient);
    }

    @Test
    void getOrder_whenCallerIsNotOwnerAndNotAdmin_throwsNotFound(){
        Order order = Order.builder().id(10L).userId(1L).build();
        when(orderRepository.findById(10L)).thenReturn(Optional.of(order));

        assertThatThrownBy(() -> orderService.getOrder(10L, 2L, "CUSTOMER")).isInstanceOf(ResourceNotFoundException.class);
    }

    private CartItemResponse cartItem(Long variantId, int quantity, String price) {
        CartItemResponse item = new CartItemResponse();
        item.setVariantId(variantId);
        item.setProductName("Ring");
        item.setSku("SKU-" + variantId);
        item.setPrice(new BigDecimal(price));
        item.setQuantity(quantity);
        return item;
    }

    private CartResponse cartWith(CartItemResponse... items) {
        CartResponse cart = new CartResponse();
        cart.setItems(List.of(items));
        cart.setTotalItems(items.length);
        return cart;
    }

    private void stubCartFetch(CartResponse response) {
        RestClient.RequestHeadersUriSpec uriSpec = mock(RestClient.RequestHeadersUriSpec.class);
        RestClient.RequestHeadersSpec headersSpec = mock(RestClient.RequestHeadersSpec.class);
        RestClient.ResponseSpec responseSpec = mock(RestClient.ResponseSpec.class);

        when(cartClient.get()).thenReturn(uriSpec);
        when(uriSpec.uri("/cart")).thenReturn(headersSpec);
        when(headersSpec.header(anyString(), anyString())).thenReturn(headersSpec);
        when(headersSpec.retrieve()).thenReturn(responseSpec);
        when(responseSpec.body(CartResponse.class)).thenReturn(response);
    }

    private PlaceOrderRequest basicRequest() {
        PlaceOrderRequest request = new PlaceOrderRequest();
        request.setFirstName("Ada");
        request.setLastName("Lovelace");
        request.setEmail("ada@example.com");
        request.setPhone("5551234567");
        request.setShippingStreet("1 Analytical Engine Way");
        request.setShippingCity("London");
        request.setShippingState("LDN");
        request.setShippingZipCode("00000");
        request.setShippingCountry("UK");
        return request;
    }

    @Test
    void reserveFails_midLoop_releasesAlreadyReservedItems() {
        CartItemResponse item1 = cartItem(1L, 1, "10.00");
        CartItemResponse item2 = cartItem(2L, 1, "10.00");
        CartItemResponse item3 = cartItem(3L, 1, "10.00");
        CartResponse cart = cartWith(item1, item2, item3);
        stubCartFetch(cart);

        when(inventoryClient.post().uri("/inventory/2/reserve").body(any(Object.class)).retrieve().toBodilessEntity())
                .thenThrow(new RuntimeException("simulated reserve failure"));

        assertThatThrownBy(() -> orderService.placeOrder(basicRequest(), 1L, null))
                .isInstanceOf(RuntimeException.class)
                .hasMessage("simulated reserve failure");

        verify(inventoryClient.post()).uri("/inventory/1/reserve");
        verify(inventoryClient.post(), times(2)).uri("/inventory/2/reserve");
        verify(inventoryClient.post(), never()).uri("/inventory/3/reserve");

        verify(inventoryClient.post()).uri("/inventory/1/release");
        verify(inventoryClient.post(), never()).uri("/inventory/2/release");
        verify(inventoryClient.post(), never()).uri("/inventory/3/release");

        verify(orderRepository, never()).save(any());
    }

    @Test
    void paymentFails_cartIsNotCleared() {
        CartItemResponse item1 = cartItem(1L, 2, "5.00");
        CartItemResponse item2 = cartItem(2L, 1, "20.00");
        CartResponse cart = cartWith(item1, item2);
        stubCartFetch(cart);

        Order savedOrder = Order.builder()
                .id(100L)
                .userId(1L)
                .orderStatus(OrderStatus.PENDING_PAYMENT)
                .paymentStatus(PaymentStatus.PENDING)
                .totalAmount(new BigDecimal("30.00"))
                .items(Collections.emptyList())
                .build();
        when(orderRepository.save(any(Order.class))).thenReturn(savedOrder);

        PaymentResponse failedPayment = new PaymentResponse();
        failedPayment.setStatus("FAILED");
        when(paymentClient.post().uri("/payments").body(any(Object.class)).retrieve().body(PaymentResponse.class))
                .thenReturn(failedPayment);

        orderService.placeOrder(basicRequest(), 1L, null);

        verify(inventoryClient.post()).uri("/inventory/1/release");
        verify(inventoryClient.post()).uri("/inventory/2/release");
        verify(inventoryClient.post(), never()).uri("/inventory/1/confirm");
        verify(inventoryClient.post(), never()).uri("/inventory/2/confirm");

        verify(cartClient, never()).delete();
        verifyNoInteractions(kafkaTemplate);
    }
}