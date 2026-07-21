package com.jewelrystore.inventory.controller;

import com.jewelrystore.inventory.dto.StockResponse;
import com.jewelrystore.inventory.security.GatewayAuthFilter;
import com.jewelrystore.inventory.security.SecurityConfig;
import com.jewelrystore.inventory.service.StockService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(StockController.class)
@Import({SecurityConfig.class, GatewayAuthFilter.class})
class InventorySecurityTest {

    @Autowired private MockMvc mockMvc;
    @MockitoBean private StockService stockService;

    private static final String STOCK_JSON = """
            {"variantId":1,"quantity":10}""";

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

    @Test
    void createStock_withoutIdentity_isRejected() throws Exception {
        mockMvc.perform(post("/inventory")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(STOCK_JSON))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void createStock_asNonAdmin_isForbidden() throws Exception {
        mockMvc.perform(post("/inventory")
                        .header("X-User-Id", "1")
                        .header("X-User-Role", "CUSTOMER")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(STOCK_JSON))
                .andExpect(status().isForbidden());
    }

    @Test
    void createStock_asAdmin_isNotRejectedBySecurity() throws Exception {
        when(stockService.createStock(any())).thenReturn(StockResponse.builder().variantId(1L).build());
        mockMvc.perform(post("/inventory")
                        .header("X-User-Id", "1")
                        .header("X-User-Role", "ADMIN")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(STOCK_JSON))
                .andExpect(status().isOk());
    }

    @Test
    void updateStock_withoutIdentity_isRejected() throws Exception {
        mockMvc.perform(put("/inventory/1")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(STOCK_JSON))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void updateStock_asNonAdmin_isForbidden() throws Exception {
        mockMvc.perform(put("/inventory/1")
                        .header("X-User-Id", "1")
                        .header("X-User-Role", "CUSTOMER")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(STOCK_JSON))
                .andExpect(status().isForbidden());
    }

    @Test
    void updateStock_asAdmin_isNotRejectedBySecurity() throws Exception {
        when(stockService.updateStock(anyLong(), any())).thenReturn(StockResponse.builder().variantId(1L).build());
        mockMvc.perform(put("/inventory/1")
                        .header("X-User-Id", "1")
                        .header("X-User-Role", "ADMIN")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(STOCK_JSON))
                .andExpect(status().isOk());
    }
}
