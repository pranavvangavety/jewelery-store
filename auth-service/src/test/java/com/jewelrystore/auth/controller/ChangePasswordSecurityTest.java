package com.jewelrystore.auth.controller;

import com.jewelrystore.auth.repository.UserRepository;
import com.jewelrystore.auth.security.GatewayAuthFilter;
import com.jewelrystore.auth.security.SecurityConfig;
import com.jewelrystore.auth.service.AuthService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(AuthController.class)
@Import({SecurityConfig.class, GatewayAuthFilter.class})
class ChangePasswordSecurityTest {

    @Autowired private MockMvc mockMvc;
    @MockitoBean private AuthService authService;
    @MockitoBean private UserRepository userRepository;

    private static final String REQUEST_JSON = """
            {"currentPassword":"oldpass123","newPassword":"newpass123"}""";

    @Test
    void changePassword_withoutIdentity_isRejected() throws Exception {
        mockMvc.perform(post("/auth/change-password")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(REQUEST_JSON))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void changePassword_withIdentity_isNotRejectedBySecurity() throws Exception {
        mockMvc.perform(post("/auth/change-password")
                        .header("X-User-Id", "1")
                        .header("X-User-Role", "CUSTOMER")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(REQUEST_JSON))
                .andExpect(status().isOk());
    }
}
