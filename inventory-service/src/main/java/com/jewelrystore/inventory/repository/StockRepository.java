package com.jewelrystore.inventory.repository;

import com.jewelrystore.inventory.entity.Stock;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface StockRepository extends JpaRepository<Stock, Long> {
    Optional<Stock> findByVariantId(Long variantId);
    boolean existsByVariantId(Long variantId);
    List<Stock> findByVariantIdIn(List<Long> variantIds);


    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT s FROM Stock s WHERE s.variantId = :variantId")
    Optional<Stock> findByVariantIdForUpdate(@Param("variantId") Long variantId);
}

