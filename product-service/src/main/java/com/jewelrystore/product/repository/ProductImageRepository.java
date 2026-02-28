package com.jewelrystore.product.repository;

import com.jewelrystore.product.entity.ProductImage;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface ProductImageRepository extends JpaRepository<ProductImage, Long>{

    List<ProductImage> findByProductIdOrderByDisplayOrder(Long productId);

}
