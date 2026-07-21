package com.jewelrystore.order.controller;

import com.jewelrystore.order.dto.OrderResponse;
import com.jewelrystore.order.entity.OrderStatus;
import com.jewelrystore.order.security.GatewayAuthFilter;
import com.jewelrystore.order.security.SecurityConfig;
import com.jewelrystore.order.service.OrderService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.context.annotation.Import;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import java.util.List;

import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(OrderController.class)
@Import({SecurityConfig.class, GatewayAuthFilter.class})
class OrderSecurityTest {

    @Autowired private MockMvc mockMvc;
    @MockitoBean private OrderService orderService;

    @Test
    // no custom entryPoint here; SecurityConfig defaults to 403, not 401
    void getAllOrders_withoutIdentity_isRejected() throws Exception {
        mockMvc.perform(get("/orders/all"))
                .andExpect(status().isForbidden());
    }

    @Test
    void getAllOrders_asNonAdmin_isForbidden() throws Exception {
        mockMvc.perform(get("/orders/all")
                        .header("X-User-Id", "1")
                        .header("X-User-Role", "CUSTOMER"))
                .andExpect(status().isForbidden());
    }

    @Test
    void getAllOrders_asAdmin_isNotRejectedBySecurity() throws Exception {
        when(orderService.getAllOrders()).thenReturn(List.of(OrderResponse.builder().id(1L).build()));
        mockMvc.perform(get("/orders/all")
                        .header("X-User-Id", "1")
                        .header("X-User-Role", "ADMIN"))
                .andExpect(status().isOk());
    }

    @Test
    // no custom entryPoint here; SecurityConfig defaults to 403, not 401
    void updateOrderStatus_withoutIdentity_isRejected() throws Exception {
        mockMvc.perform(patch("/orders/1/status").param("status", OrderStatus.CONFIRMED.name()))
                .andExpect(status().isForbidden());
    }

    @Test
    void updateOrderStatus_asNonAdmin_isForbidden() throws Exception {
        mockMvc.perform(patch("/orders/1/status").param("status", OrderStatus.CONFIRMED.name())
                        .header("X-User-Id", "1")
                        .header("X-User-Role", "CUSTOMER"))
                .andExpect(status().isForbidden());
    }

    @Test
    void updateOrderStatus_asAdmin_isNotRejectedBySecurity() throws Exception {
        when(orderService.updateOrderStatus(anyLong(), any())).thenReturn(OrderResponse.builder().id(1L).build());
        mockMvc.perform(patch("/orders/1/status").param("status", OrderStatus.CONFIRMED.name())
                        .header("X-User-Id", "1")
                        .header("X-User-Role", "ADMIN"))
                .andExpect(status().isOk());
    }
}
