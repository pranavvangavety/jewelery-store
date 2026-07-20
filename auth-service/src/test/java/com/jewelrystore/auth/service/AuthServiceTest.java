package com.jewelrystore.auth.service;

import com.jewelrystore.auth.dto.ChangePasswordRequest;
import com.jewelrystore.auth.dto.ForgotPasswordRequest;
import com.jewelrystore.auth.dto.RegisterRequest;
import com.jewelrystore.auth.dto.ResetPasswordRequest;
import com.jewelrystore.auth.entity.Role;
import com.jewelrystore.auth.entity.TokenType;
import com.jewelrystore.auth.entity.User;
import com.jewelrystore.auth.entity.VerificationToken;
import com.jewelrystore.auth.messaging.TransactionalEventPublisher;
import com.jewelrystore.auth.repository.UserRepository;
import com.jewelrystore.auth.repository.VerificationTokenRepository;
import com.jewelrystore.auth.security.JwtUtil;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.time.LocalDateTime;
import java.util.Optional;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class AuthServiceTest {

    @Mock
    private UserRepository userRepository;

    @Mock
    private VerificationTokenRepository tokenRepository;

    @Mock
    private PasswordEncoder passwordEncoder;

    @Mock
    private JwtUtil jwtUtil;

    @Mock
    private TransactionalEventPublisher eventPublisher;

    @InjectMocks
    private AuthService authService;

    @Test
    void register_publishesUserRegisteredAndEmailVerificationEvents() {
        RegisterRequest request = new RegisterRequest();
        request.setFirstName("Jane");
        request.setLastName("Doe");
        request.setEmail("jane@example.com");
        request.setPassword("password123");

        when(userRepository.existsByEmail("jane@example.com")).thenReturn(false);
        when(passwordEncoder.encode("password123")).thenReturn("encoded");
        when(userRepository.save(any(User.class))).thenAnswer(invocation -> {
            User user = invocation.getArgument(0);
            user.setId(1L);
            return user;
        });

        authService.register(request);

        verify(eventPublisher, times(1)).publishAfterCommit(eq("user-registered"), any());
        verify(eventPublisher, times(1)).publishAfterCommit(eq("email-verification"), any());
    }

    @Test
    void resendVerification_whenUserExistsAndUnverified_publishesEmailVerificationEvent() {
        User user = User.builder()
                .id(1L)
                .firstName("Jane")
                .lastName("Doe")
                .email("jane@example.com")
                .password("encoded")
                .role(Role.CUSTOMER)
                .emailVerified(false)
                .build();

        ForgotPasswordRequest request = new ForgotPasswordRequest();
        request.setEmail("jane@example.com");

        when(userRepository.findByEmail("jane@example.com")).thenReturn(Optional.of(user));

        authService.resendVerification(request);

        verify(eventPublisher, times(1)).publishAfterCommit(eq("email-verification"), any());
    }

    @Test
    void resendVerification_whenUserAlreadyVerified_doesNotPublish() {
        User user = User.builder()
                .id(1L)
                .firstName("Jane")
                .lastName("Doe")
                .email("jane@example.com")
                .password("encoded")
                .role(Role.CUSTOMER)
                .emailVerified(true)
                .build();

        ForgotPasswordRequest request = new ForgotPasswordRequest();
        request.setEmail("jane@example.com");

        when(userRepository.findByEmail("jane@example.com")).thenReturn(Optional.of(user));

        authService.resendVerification(request);

        verifyNoInteractions(eventPublisher);
    }

    @Test
    void forgotPassword_whenUserExists_publishesPasswordResetRequestedEvent() {
        User user = User.builder()
                .id(1L)
                .firstName("Jane")
                .lastName("Doe")
                .email("jane@example.com")
                .password("encoded")
                .role(Role.CUSTOMER)
                .emailVerified(true)
                .build();

        ForgotPasswordRequest request = new ForgotPasswordRequest();
        request.setEmail("jane@example.com");

        when(userRepository.findByEmail("jane@example.com")).thenReturn(Optional.of(user));

        authService.forgotPassword(request);

        verify(eventPublisher, times(1)).publishAfterCommit(eq("password-reset-requested"), any());
    }

    @Test
    void changePassword_onSuccess_publishesPasswordChangedEvent() {
        User user = User.builder()
                .id(1L)
                .firstName("Jane")
                .lastName("Doe")
                .email("jane@example.com")
                .password("encoded")
                .role(Role.CUSTOMER)
                .emailVerified(true)
                .build();

        ChangePasswordRequest request = new ChangePasswordRequest();
        request.setCurrentPassword("oldpassword");
        request.setNewPassword("newpassword1");

        when(userRepository.findById(1L)).thenReturn(Optional.of(user));
        when(passwordEncoder.matches(anyString(), anyString())).thenReturn(true);
        when(passwordEncoder.encode(anyString())).thenReturn("newEncoded");

        authService.changePassword(1L, request);

        verify(eventPublisher, times(1)).publishAfterCommit(eq("password-changed"), any());
    }

    @Test
    void resetPassword_onSuccess_publishesPasswordChangedEvent() {
        VerificationToken vt = VerificationToken.builder()
                .id(1L)
                .userId(1L)
                .token("reset-token")
                .type(TokenType.PASSWORD_RESET)
                .expiresAt(LocalDateTime.now().plusMinutes(10))
                .used(false)
                .build();

        User user = User.builder()
                .id(1L)
                .firstName("Jane")
                .lastName("Doe")
                .email("jane@example.com")
                .password("encoded")
                .role(Role.CUSTOMER)
                .emailVerified(true)
                .build();

        ResetPasswordRequest request = new ResetPasswordRequest();
        request.setToken("reset-token");
        request.setNewPassword("newpassword1");

        when(tokenRepository.findByTokenAndType("reset-token", TokenType.PASSWORD_RESET)).thenReturn(Optional.of(vt));
        when(userRepository.findById(1L)).thenReturn(Optional.of(user));
        when(passwordEncoder.encode(anyString())).thenReturn("newEncoded");

        authService.resetPassword(request);

        verify(eventPublisher, times(1)).publishAfterCommit(eq("password-changed"), any());
    }
}
