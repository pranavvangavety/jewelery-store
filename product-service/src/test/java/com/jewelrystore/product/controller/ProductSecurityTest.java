package com.jewelrystore.product.controller;

import com.jewelrystore.product.security.GatewayAuthFilter;
import com.jewelrystore.product.security.SecurityConfig;
import com.jewelrystore.product.service.CategoryService;
import com.jewelrystore.product.service.ProductService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.context.annotation.Import;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(ProductController.class)
@Import({SecurityConfig.class, GatewayAuthFilter.class})
class ProductSecurityTest {

    @Autowired private MockMvc mockMvc;
    @MockitoBean private ProductService productService;
    @MockitoBean private CategoryService categoryService;

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
}