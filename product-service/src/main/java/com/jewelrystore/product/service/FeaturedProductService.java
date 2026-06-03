package com.jewelrystore.product.service;

import com.jewelrystore.product.dto.ProductResponse;
import com.jewelrystore.product.entity.FeaturedProduct;
import com.jewelrystore.product.entity.ProductStatus;
import com.jewelrystore.product.exception.DuplicateResourceException;
import com.jewelrystore.product.exception.ResourceNotFoundException;
import com.jewelrystore.product.repository.FeaturedProductRepository;
import com.jewelrystore.product.repository.ProductRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class FeaturedProductService {

    private final FeaturedProductRepository featuredProductRepository;
    private final ProductService productService;
    private final ProductRepository productRepository;

    @Transactional(readOnly = true)
    public List<ProductResponse> getFeaturedProducts(){

        return featuredProductRepository.findAll().stream().map(fp -> productService.mapToResponse(fp.getProduct())).toList();
    }

    @Transactional
    public void addFeaturedProduct(Long productId){
        if(featuredProductRepository.existsByProductId(productId)){
            throw new DuplicateResourceException("Product " + productId + " is already featured");
        }

        var product = productRepository.findByIdAndStatus(productId, ProductStatus.ACTIVE)
                .orElseThrow(() -> new ResourceNotFoundException("Active product not found with id: " + productId));

        featuredProductRepository.save(FeaturedProduct.builder().product(product).build());
    }

    @Transactional
    public void removeFeaturedProduct(Long productId){
        if(!featuredProductRepository.existsByProductId(productId)){
            throw new ResourceNotFoundException("Product is not currently featured");
        }
        featuredProductRepository.deleteByProductId(productId);
    }
}
