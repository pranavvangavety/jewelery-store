package com.jewelrystore.inventory.controller;

import com.jewelrystore.inventory.security.GatewayAuthFilter;
import com.jewelrystore.inventory.security.SecurityConfig;
import com.jewelrystore.inventory.service.StockService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.context.annotation.Import;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(StockController.class)
@Import({SecurityConfig.class, GatewayAuthFilter.class})
class InventorySecurityTest {

    @Autowired private MockMvc mockMvc;
    @MockitoBean private StockService stockService;

    @Test
    void getAllStock_withoutIdentity_isRejected() throws Exception {
        mockMvc.perform(get("/inventory"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void getAllStock_asNonAdmin_isForbidden() throws Exception {
        mockMvc.perform(get("/inventory")
                        .header("X-User-Id", "1")
                        .header("X-User-Role", "CUSTOMER"))
                .andExpect(status().isForbidden());
    }
}