package com.jewelrystore.user.security;

import com.jewelrystore.user.controller.UserController;
import com.jewelrystore.user.dto.UserProfileResponse;
import com.jewelrystore.user.service.UserService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.context.annotation.Import;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(UserController.class)
@Import({SecurityConfig.class, GatewayAuthFilter.class})
class SecurityConfigTest {

    @Autowired
    private MockMvc mockMvc;

    @MockitoBean
    private UserService userService;

    @Test
    void getProfile_withoutIdentityHeaders_returns401() throws Exception {
        mockMvc.perform(get("/users/me"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void getProfile_withIdentityHeaders_isNotRejectedBySecurity() throws Exception {
        when(userService.getProfileByAuthId(anyLong()))
                .thenReturn(UserProfileResponse.builder()
                        .id(1L)
                        .authId(1L)
                        .firstName("Test")
                        .lastName("User")
                        .email("test@example.com")
                        .build());

        mockMvc.perform(get("/users/me")
                        .header("X-User-Id", "1")
                        .header("X-User-Role", "CUSTOMER"))
                .andExpect(status().isOk());
    }
}
