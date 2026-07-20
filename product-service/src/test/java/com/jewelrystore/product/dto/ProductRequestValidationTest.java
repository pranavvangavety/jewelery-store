package com.jewelrystore.product.dto;

import com.jewelrystore.product.entity.Material;
import jakarta.validation.ConstraintViolation;
import jakarta.validation.Validation;
import jakarta.validation.Validator;
import jakarta.validation.ValidatorFactory;
import org.junit.jupiter.api.Test;

import java.math.BigDecimal;
import java.util.List;
import java.util.Set;

import static org.assertj.core.api.Assertions.assertThat;

class ProductRequestValidationTest {

    @Test
    void variantsWithInvalidNestedFields_cascadeValidationFailure() {
        ValidatorFactory factory = Validation.buildDefaultValidatorFactory();
        Validator validator = factory.getValidator();

        ProductVariantRequest variantRequest = new ProductVariantRequest();
        variantRequest.setSku("SKU-1");
        variantRequest.setPrice(null);

        ProductRequest request = new ProductRequest();
        request.setName("Ring");
        request.setMaterial(Material.GOLD);
        request.setCategoryId(1L);
        request.setVariants(List.of(variantRequest));

        Set<ConstraintViolation<ProductRequest>> violations = validator.validate(request);

        assertThat(violations).isNotEmpty();
    }
}
