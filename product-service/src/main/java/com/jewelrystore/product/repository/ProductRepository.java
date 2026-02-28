package com.jewelrystore.product.repository;

import com.jewelrystore.product.entity.Product;
import com.jewelrystore.product.entity.ProductStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ProductRepository extends JpaRepository<Product, Long> {
    List<Product> findByStatus(ProductStatus status);
    List<Product> findByCategoryIdAndStatus(Long categoryId, ProductStatus status);
    Optional<Product> findByIdAndStatus(Long id, ProductStatus status);
}
