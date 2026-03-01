package com.jewelrystore.inventory.repository;

import com.jewelrystore.inventory.entity.Stock;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface StockRepository extends JpaRepository<Stock, Long> {
    Optional<Stock> findByVariantId(Long variantId);
    boolean existsByVariantId(Long variantId);
    List<Stock> findByVariantIdIn(List<Long> variantIds);

}
