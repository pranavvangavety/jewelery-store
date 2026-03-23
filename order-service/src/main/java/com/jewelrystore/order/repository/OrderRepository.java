package com.jewelrystore.order.repository;

import com.jewelrystore.order.entity.Order;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;

public interface OrderRepository extends JpaRepository<Order, Long> {
//    List<Order> findByUserId(Long userId);

    @Query("SELECT o FROM Order o WHERE o.userId = :userId ORDER BY o.createdAt DESC")
    List<Order> findByIdOrderByCreatedAtDesc(Long userId);
}
