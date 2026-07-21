package com.jewelrystore.product.controller;

import com.jewelrystore.product.dto.CategoryResponse;
import com.jewelrystore.product.dto.ProductResponse;
import com.jewelrystore.product.entity.Material;
import com.jewelrystore.product.security.GatewayAuthFilter;
import com.jewelrystore.product.security.SecurityConfig;
import com.jewelrystore.product.service.CategoryService;
import com.jewelrystore.product.service.FeaturedProductService;
import com.jewelrystore.product.service.ProductService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest({ProductController.class, FeaturedProductController.class})
@Import({SecurityConfig.class, GatewayAuthFilter.class})
class ProductSecurityTest {

    @Autowired private MockMvc mockMvc;
    @MockitoBean private ProductService productService;
    @MockitoBean private CategoryService categoryService;
    @MockitoBean private FeaturedProductService featuredProductService;

    private static final String PRODUCT_JSON = """
            {"name":"Ring","material":"GOLD","categoryId":1,
             "variants":[{"sku":"SKU1","price":10.00}]}""";
    private static final String VARIANT_JSON = """
            {"sku":"SKU1","price":10.00}""";
    private static final String CATEGORY_JSON = """
            {"name":"Rings"}""";
    private static final String IMAGE_JSON = """
            {"variantId":1,"url":"http://example.com/a.jpg","displayOrder":1}""";

    @Test
    void getAllProducts_withoutIdentity_isRejected() throws Exception {
        mockMvc.perform(get("/products/all"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void getAllProducts_asNonAdmin_isForbidden() throws Exception {
        mockMvc.perform(get("/products/all")
                        .header("X-User-Id", "1")
                        .header("X-User-Role", "CUSTOMER"))
                .andExpect(status().isForbidden());
    }

    @Test
    void createProduct_withoutIdentity_isRejected() throws Exception {
        mockMvc.perform(post("/products")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(PRODUCT_JSON))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void createProduct_asNonAdmin_isForbidden() throws Exception {
        mockMvc.perform(post("/products")
                        .header("X-User-Id", "1")
                        .header("X-User-Role", "CUSTOMER")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(PRODUCT_JSON))
                .andExpect(status().isForbidden());
    }

    @Test
    void createProduct_asAdmin_isNotRejectedBySecurity() throws Exception {
        when(productService.createProduct(any())).thenReturn(ProductResponse.builder().id(1L).build());
        mockMvc.perform(post("/products")
                        .header("X-User-Id", "1")
                        .header("X-User-Role", "ADMIN")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(PRODUCT_JSON))
                .andExpect(status().isOk());
    }

    @Test
    void updateProduct_withoutIdentity_isRejected() throws Exception {
        mockMvc.perform(put("/products/1")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(PRODUCT_JSON))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void updateProduct_asNonAdmin_isForbidden() throws Exception {
        mockMvc.perform(put("/products/1")
                        .header("X-User-Id", "1")
                        .header("X-User-Role", "CUSTOMER")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(PRODUCT_JSON))
                .andExpect(status().isForbidden());
    }

    @Test
    void updateProduct_asAdmin_isNotRejectedBySecurity() throws Exception {
        when(productService.updateProduct(anyLong(), any())).thenReturn(ProductResponse.builder().id(1L).build());
        mockMvc.perform(put("/products/1")
                        .header("X-User-Id", "1")
                        .header("X-User-Role", "ADMIN")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(PRODUCT_JSON))
                .andExpect(status().isOk());
    }

    @Test
    void createCategory_withoutIdentity_isRejected() throws Exception {
        mockMvc.perform(post("/categories")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(CATEGORY_JSON))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void createCategory_asNonAdmin_isForbidden() throws Exception {
        mockMvc.perform(post("/categories")
                        .header("X-User-Id", "1")
                        .header("X-User-Role", "CUSTOMER")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(CATEGORY_JSON))
                .andExpect(status().isForbidden());
    }

    @Test
    void createCategory_asAdmin_isNotRejectedBySecurity() throws Exception {
        when(categoryService.createCategory(any())).thenReturn(CategoryResponse.builder().id(1L).build());
        mockMvc.perform(post("/categories")
                        .header("X-User-Id", "1")
                        .header("X-User-Role", "ADMIN")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(CATEGORY_JSON))
                .andExpect(status().isOk());
    }

    @Test
    void deleteCategory_withoutIdentity_isRejected() throws Exception {
        mockMvc.perform(delete("/categories/1"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void deleteCategory_asNonAdmin_isForbidden() throws Exception {
        mockMvc.perform(delete("/categories/1")
                        .header("X-User-Id", "1")
                        .header("X-User-Role", "CUSTOMER"))
                .andExpect(status().isForbidden());
    }

    @Test
    void deleteCategory_asAdmin_isNotRejectedBySecurity() throws Exception {
        mockMvc.perform(delete("/categories/1")
                        .header("X-User-Id", "1")
                        .header("X-User-Role", "ADMIN"))
                .andExpect(status().isNoContent());
    }

    @Test
    void updateCategory_withoutIdentity_isRejected() throws Exception {
        mockMvc.perform(put("/categories/1").param("description", "desc"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void updateCategory_asNonAdmin_isForbidden() throws Exception {
        mockMvc.perform(put("/categories/1").param("description", "desc")
                        .header("X-User-Id", "1")
                        .header("X-User-Role", "CUSTOMER"))
                .andExpect(status().isForbidden());
    }

    @Test
    void updateCategory_asAdmin_isNotRejectedBySecurity() throws Exception {
        when(categoryService.updateCategory(anyLong(), anyString())).thenReturn(CategoryResponse.builder().id(1L).build());
        mockMvc.perform(put("/categories/1").param("description", "desc")
                        .header("X-User-Id", "1")
                        .header("X-User-Role", "ADMIN"))
                .andExpect(status().isOk());
    }

    @Test
    void addVariant_withoutIdentity_isRejected() throws Exception {
        mockMvc.perform(post("/products/1/variants")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(VARIANT_JSON))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void addVariant_asNonAdmin_isForbidden() throws Exception {
        mockMvc.perform(post("/products/1/variants")
                        .header("X-User-Id", "1")
                        .header("X-User-Role", "CUSTOMER")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(VARIANT_JSON))
                .andExpect(status().isForbidden());
    }

    @Test
    void addVariant_asAdmin_isNotRejectedBySecurity() throws Exception {
        when(productService.addVariant(anyLong(), any())).thenReturn(ProductResponse.builder().id(1L).build());
        mockMvc.perform(post("/products/1/variants")
                        .header("X-User-Id", "1")
                        .header("X-User-Role", "ADMIN")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(VARIANT_JSON))
                .andExpect(status().isOk());
    }

    @Test
    void updateVariant_withoutIdentity_isRejected() throws Exception {
        mockMvc.perform(put("/products/1/variants/1")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(VARIANT_JSON))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void updateVariant_asNonAdmin_isForbidden() throws Exception {
        mockMvc.perform(put("/products/1/variants/1")
                        .header("X-User-Id", "1")
                        .header("X-User-Role", "CUSTOMER")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(VARIANT_JSON))
                .andExpect(status().isForbidden());
    }

    @Test
    void updateVariant_asAdmin_isNotRejectedBySecurity() throws Exception {
        when(productService.updateVariant(anyLong(), anyLong(), any())).thenReturn(ProductResponse.builder().id(1L).build());
        mockMvc.perform(put("/products/1/variants/1")
                        .header("X-User-Id", "1")
                        .header("X-User-Role", "ADMIN")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(VARIANT_JSON))
                .andExpect(status().isOk());
    }

    @Test
    void deleteVariant_withoutIdentity_isRejected() throws Exception {
        mockMvc.perform(delete("/products/1/variants/1"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void deleteVariant_asNonAdmin_isForbidden() throws Exception {
        mockMvc.perform(delete("/products/1/variants/1")
                        .header("X-User-Id", "1")
                        .header("X-User-Role", "CUSTOMER"))
                .andExpect(status().isForbidden());
    }

    @Test
    void deleteVariant_asAdmin_isNotRejectedBySecurity() throws Exception {
        mockMvc.perform(delete("/products/1/variants/1")
                        .header("X-User-Id", "1")
                        .header("X-User-Role", "ADMIN"))
                .andExpect(status().isNoContent());
    }

    @Test
    void addImage_withoutIdentity_isRejected() throws Exception {
        mockMvc.perform(post("/products/1/images")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(IMAGE_JSON))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void addImage_asNonAdmin_isForbidden() throws Exception {
        mockMvc.perform(post("/products/1/images")
                        .header("X-User-Id", "1")
                        .header("X-User-Role", "CUSTOMER")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(IMAGE_JSON))
                .andExpect(status().isForbidden());
    }

    @Test
    void addImage_asAdmin_isNotRejectedBySecurity() throws Exception {
        when(productService.addImage(anyLong(), any())).thenReturn(ProductResponse.builder().id(1L).build());
        mockMvc.perform(post("/products/1/images")
                        .header("X-User-Id", "1")
                        .header("X-User-Role", "ADMIN")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(IMAGE_JSON))
                .andExpect(status().isOk());
    }

    @Test
    void deleteImage_withoutIdentity_isRejected() throws Exception {
        mockMvc.perform(delete("/products/1/images/1"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void deleteImage_asNonAdmin_isForbidden() throws Exception {
        mockMvc.perform(delete("/products/1/images/1")
                        .header("X-User-Id", "1")
                        .header("X-User-Role", "CUSTOMER"))
                .andExpect(status().isForbidden());
    }

    @Test
    void deleteImage_asAdmin_isNotRejectedBySecurity() throws Exception {
        when(productService.deleteImage(anyLong(), anyLong())).thenReturn(ProductResponse.builder().id(1L).build());
        mockMvc.perform(delete("/products/1/images/1")
                        .header("X-User-Id", "1")
                        .header("X-User-Role", "ADMIN"))
                .andExpect(status().isOk());
    }

    @Test
    void setPrimaryImage_withoutIdentity_isRejected() throws Exception {
        mockMvc.perform(patch("/products/1/images/1/primary"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void setPrimaryImage_asNonAdmin_isForbidden() throws Exception {
        mockMvc.perform(patch("/products/1/images/1/primary")
                        .header("X-User-Id", "1")
                        .header("X-User-Role", "CUSTOMER"))
                .andExpect(status().isForbidden());
    }

    @Test
    void setPrimaryImage_asAdmin_isNotRejectedBySecurity() throws Exception {
        when(productService.setPrimaryImage(anyLong(), anyLong())).thenReturn(ProductResponse.builder().id(1L).build());
        mockMvc.perform(patch("/products/1/images/1/primary")
                        .header("X-User-Id", "1")
                        .header("X-User-Role", "ADMIN"))
                .andExpect(status().isOk());
    }

    @Test
    void addFeatured_withoutIdentity_isRejected() throws Exception {
        mockMvc.perform(post("/featured/1"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void addFeatured_asNonAdmin_isForbidden() throws Exception {
        mockMvc.perform(post("/featured/1")
                        .header("X-User-Id", "1")
                        .header("X-User-Role", "CUSTOMER"))
                .andExpect(status().isForbidden());
    }

    @Test
    void addFeatured_asAdmin_isNotRejectedBySecurity() throws Exception {
        mockMvc.perform(post("/featured/1")
                        .header("X-User-Id", "1")
                        .header("X-User-Role", "ADMIN"))
                .andExpect(status().isNoContent());
    }

    @Test
    void removeFeatured_withoutIdentity_isRejected() throws Exception {
        mockMvc.perform(delete("/featured/1"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void removeFeatured_asNonAdmin_isForbidden() throws Exception {
        mockMvc.perform(delete("/featured/1")
                        .header("X-User-Id", "1")
                        .header("X-User-Role", "CUSTOMER"))
                .andExpect(status().isForbidden());
    }

    @Test
    void removeFeatured_asAdmin_isNotRejectedBySecurity() throws Exception {
        mockMvc.perform(delete("/featured/1")
                        .header("X-User-Id", "1")
                        .header("X-User-Role", "ADMIN"))
                .andExpect(status().isNoContent());
    }
}
