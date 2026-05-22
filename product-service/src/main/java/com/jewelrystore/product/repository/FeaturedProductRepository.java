package com.jewelrystore.product.repository;

import com.jewelrystore.product.entity.FeaturedProduct;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface FeaturedProductRepository extends JpaRepository<FeaturedProduct, Long> {

    boolean existsByProductId(Long productId);

    void deleteByProductId(Long productId);

}
