package com.jewelrystore.order.service;

import com.jewelrystore.order.entity.Order;
import com.jewelrystore.order.exception.ResourceNotFoundException;
import com.jewelrystore.order.repository.OrderRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.web.client.RestClient;

import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
public class OrderServiceTest {
    @Mock private OrderRepository orderRepository;
    @Mock private KafkaTemplate<String, Object> kafkaTemplate;
    @Mock private RestClient cartClient;
    @Mock private RestClient userClient;
    @Mock private RestClient inventoryClient;
    @Mock private RestClient paymentClient;

    @InjectMocks private OrderService orderService;

    @Test
    void getOrder_whenCallerIsNotOwnerAndNotAdmin_throwsNotFound(){
        Order order = Order.builder().id(10L).userId(1L).build();
        when(orderRepository.findById(10L)).thenReturn(Optional.of(order));

        assertThatThrownBy(() -> orderService.getOrder(10L, 2L, "CUSTOMER")).isInstanceOf(ResourceNotFoundException.class);
    }
}
