package com.jewelrystore.order.repository;

import com.jewelrystore.order.entity.Order;
import com.jewelrystore.order.entity.OrderStatus;
import com.jewelrystore.order.entity.PaymentStatus;
import jakarta.persistence.EntityManager;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.jdbc.AutoConfigureTestDatabase;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;
import org.springframework.boot.testcontainers.service.connection.ServiceConnection;
import org.springframework.test.context.ActiveProfiles;
import org.testcontainers.containers.PostgreSQLContainer;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;

@DataJpaTest
@AutoConfigureTestDatabase(replace = AutoConfigureTestDatabase.Replace.NONE)
@ActiveProfiles("test")
@Testcontainers
class OrderRepositoryTest {

    @Container
    @ServiceConnection
    static PostgreSQLContainer<?> postgres = new PostgreSQLContainer<>("postgres:17-alpine");

    @Autowired private OrderRepository orderRepository;
    @Autowired private EntityManager entityManager;

    @Test
    void findByUserIdOrderByCreatedAtDesc_returnsNewestFirst_excludingOtherUsers() {
        Long userId = 1L;

        Order oldest = orderRepository.save(order(userId, LocalDateTime.now().minusDays(2)));
        Order newest = orderRepository.save(order(userId, LocalDateTime.now()));
        Order middle = orderRepository.save(order(userId, LocalDateTime.now().minusDays(1)));
        orderRepository.save(order(2L, LocalDateTime.now()));

        List<Order> result = orderRepository.findByUserIdOrderByCreatedAtDesc(userId);

        assertThat(result).hasSize(3);
        assertThat(result).extracting(Order::getId)
                .containsExactly(newest.getId(), middle.getId(), oldest.getId());
        assertThat(result).allMatch(o -> o.getUserId().equals(userId));
    }

    private Order order(Long userId, LocalDateTime createdAt) {
        Order o = Order.builder()
                .userId(userId)
                .firstName("Test")
                .lastName("User")
                .email("test@example.com")
                .shippingStreet("1 Main St")
                .shippingCity("City")
                .shippingState("ST")
                .shippingZip("12345")
                .shippingCountry("US")
                .orderStatus(OrderStatus.PENDING_PAYMENT)
                .paymentStatus(PaymentStatus.PENDING)
                .totalAmount(BigDecimal.TEN)
                .build();
        o = orderRepository.saveAndFlush(o);
        // createdAt is updatable=false; bulk update bypasses that to control ordering
        entityManager.createQuery("update Order o set o.createdAt = :t where o.id = :id")
                .setParameter("t", createdAt)
                .setParameter("id", o.getId())
                .executeUpdate();
        entityManager.clear();
        return orderRepository.findById(o.getId()).orElseThrow();
    }
}
