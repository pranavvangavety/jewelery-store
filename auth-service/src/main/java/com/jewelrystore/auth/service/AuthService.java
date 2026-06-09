package com.jewelrystore.auth.service;

import com.jewelrystore.auth.dto.*;
import com.jewelrystore.auth.entity.Role;
import com.jewelrystore.auth.entity.TokenType;
import com.jewelrystore.auth.entity.User;
import com.jewelrystore.auth.entity.VerificationToken;
import com.jewelrystore.auth.event.EmailVerificationEvent;
import com.jewelrystore.auth.event.PasswordChangedEvent;
import com.jewelrystore.auth.event.PasswordResetEvent;
import com.jewelrystore.auth.event.UserRegisteredEvent;
import com.jewelrystore.auth.exception.DuplicateResourceException;
import com.jewelrystore.auth.exception.EmailNotVerifiedException;
import com.jewelrystore.auth.exception.ResourceNotFoundException;
import com.jewelrystore.auth.repository.UserRepository;
import com.jewelrystore.auth.repository.VerificationTokenRepository;
import com.jewelrystore.auth.security.JwtUtil;
import com.jewelrystore.auth.exception.InvalidOperationException;
import lombok.RequiredArgsConstructor;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository userRepository;
    private final VerificationTokenRepository tokenRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtUtil jwtUtil;
    private final KafkaTemplate<String, Object> kafkaTemplate;

    @Transactional
    public AuthResponse register(RegisterRequest request) {
        if(userRepository.existsByEmail(request.getEmail())) {
//            throw new RuntimeException("Email already in use");
            throw new DuplicateResourceException("Email already in use");
        }

        User user = User.builder()
                .firstName(request.getFirstName())
                .lastName(request.getLastName())
                .email(request.getEmail())
                .password(passwordEncoder.encode(request.getPassword()))
                .role(Role.CUSTOMER)
                .build();

        userRepository.save(user);

        //kafka
        kafkaTemplate.send("user-registered", UserRegisteredEvent.builder()
                .userId(user.getId())
                .email(user.getEmail())
                .firstName(user.getFirstName())
                .lastName(user.getLastName())
                .build()
        );

        String verificationToken = UUID.randomUUID().toString();

        tokenRepository.save(VerificationToken.builder()
                .userId(user.getId())
                .token(verificationToken)
                .type(TokenType.EMAIL_VERIFICATION)
                .expiresAt(LocalDateTime.now().plusHours(24))
                .used(false)
                .build()
        );

        kafkaTemplate.send("email-verification", EmailVerificationEvent.builder()
                .email(user.getEmail())
                .firstName(user.getFirstName())
                .token(verificationToken)
                .build()

        );
        return AuthResponse.builder()
                .email(user.getEmail())
                .role(user.getRole().name())
                .firstName(user.getFirstName())
                .build();
    }

    public AuthResponse login(LoginRequest request) {
        User user = userRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        if (!passwordEncoder.matches(request.getPassword(), user.getPassword())) {
            throw new BadCredentialsException("Invalid password");
        }

        if(!user.isEmailVerified()){
            throw new EmailNotVerifiedException("Please verify your email before logging in");
        }

        String token = jwtUtil.generateToken(user.getEmail(), user.getRole().name(), user.getId());

        return AuthResponse.builder()
                .token(token)
                .email(user.getEmail())
                .role(user.getRole().name())
                .firstName(user.getFirstName())
                .build();
    }

    @Transactional
    public void verifyEmail(String token) {
        VerificationToken vt = tokenRepository.findByTokenAndType(token, TokenType.EMAIL_VERIFICATION)
                .orElseThrow(() -> new ResourceNotFoundException("Invalid verification token"));

        if(vt.isUsed()) throw new InvalidOperationException("Token has already been used");
        if(vt.getExpiresAt().isBefore(LocalDateTime.now())) throw new InvalidOperationException("Verification token has expired");

        User user = userRepository.findById(vt.getUserId())
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        user.setEmailVerified(true);
        userRepository.save(user);
        vt.setUsed(true);
        tokenRepository.save(vt);
    }

    @Transactional
    public void forgotPassword(ForgotPasswordRequest request) {
        userRepository.findByEmail(request.getEmail()).ifPresent(
                user -> {
                    tokenRepository.deleteByUserIdAndType(user.getId(), TokenType.PASSWORD_RESET);

                    String token = UUID.randomUUID().toString();
                    tokenRepository.save(VerificationToken.builder()
                                    .userId(user.getId())
                                    .token(token)
                                    .type(TokenType.PASSWORD_RESET)
                                    .expiresAt(LocalDateTime.now().plusMinutes(15))
                                    .used(false)
                            .build());

                    kafkaTemplate.send("password-reset-requested", PasswordResetEvent.builder()
                            .email(user.getEmail())
                            .firstName(user.getFirstName())
                            .token(token)
                            .build()
                    );
                }
        );
    }

    @Transactional
    public void resetPassword(ResetPasswordRequest request) {
        VerificationToken vt = tokenRepository.findByTokenAndType(request.getToken(), TokenType.PASSWORD_RESET)
                .orElseThrow(() -> new ResourceNotFoundException("Invalid or expired reset token"));

        if(vt.isUsed()) throw new InvalidOperationException("Token has already been used");
        if(vt.getExpiresAt().isBefore(LocalDateTime.now())) throw new InvalidOperationException("Reset token has expired");

        User user = userRepository.findById(vt.getUserId())
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        user.setPassword(passwordEncoder.encode(request.getNewPassword()));
        userRepository.save(user);
        vt.setUsed(true);
        tokenRepository.save(vt);

        kafkaTemplate.send("password-changed", PasswordChangedEvent.builder()
                .email(user.getEmail())
                .firstName(user.getFirstName())
                .build()
        );
    }

    @Transactional
    public void changePassword(Long userId, ChangePasswordRequest request) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        if (!passwordEncoder.matches(request.getCurrentPassword(), user.getPassword()))
            throw new BadCredentialsException("Current password is incorrect");

        user.setPassword(passwordEncoder.encode(request.getNewPassword()));
        userRepository.save(user);

        kafkaTemplate.send("password-changed", PasswordChangedEvent.builder()
                .email(user.getEmail())
                .firstName(user.getFirstName())
                .build()
        );
    }

    @Transactional
    public void resendVerification(ForgotPasswordRequest request) {
        userRepository.findByEmail(request.getEmail()).ifPresent(user -> {
            if(user.isEmailVerified()) return;

            tokenRepository.deleteByUserIdAndType(user.getId(), TokenType.EMAIL_VERIFICATION);

            String token = UUID.randomUUID().toString();
            tokenRepository.save(VerificationToken.builder()
                            .userId(user.getId())
                            .token(token)
                            .type(TokenType.EMAIL_VERIFICATION)
                            .expiresAt(LocalDateTime.now().plusHours(24))
                            .used(false)
                    .build());

            kafkaTemplate.send("email-verification", EmailVerificationEvent.builder()
                    .email(user.getEmail())
                    .firstName(user.getFirstName())
                    .token(token)
                    .build()
            );
        });

    }


}
