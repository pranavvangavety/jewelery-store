package com.jewelrystore.auth.controller;

import com.jewelrystore.auth.dto.*;
import com.jewelrystore.auth.exception.DuplicateResourceException;
import com.jewelrystore.auth.exception.EmailNotVerifiedException;
import com.jewelrystore.auth.exception.InvalidOperationException;
import com.jewelrystore.auth.exception.ResourceNotFoundException;

import com.jewelrystore.auth.service.AuthService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;

@RestController
@RequestMapping("/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;

    @PostMapping("/register")
//    public ResponseEntity<AuthResponse> register(@Valid @RequestBody RegisterRequest request) {
//        return ResponseEntity.ok(authService.register(request));
//    }

    public ResponseEntity<?> register(@Valid @RequestBody RegisterRequest request) {
        try {
            return ResponseEntity.ok(authService.register(request));
        } catch (DuplicateResourceException ex) {
            return ResponseEntity.status(409).body(
                    ErrorResponse.builder()
                            .status(409)
                            .error("Conflict")
                            .message(ex.getMessage())
                            .path("/auth/register")
                            .timestamp(LocalDateTime.now())
                            .build()
            );
        }
    }

    @PostMapping("/login")
//    public ResponseEntity<AuthResponse> login(@Valid @RequestBody LoginRequest request) {
//        return ResponseEntity.ok(authService.login(request));
//    }
    public ResponseEntity<?> login(@Valid @RequestBody LoginRequest request) {
        try {
            return ResponseEntity.ok(authService.login(request));
        } catch (ResourceNotFoundException | BadCredentialsException ex) {
            return ResponseEntity.status(401).body(
                    ErrorResponse.builder()
                            .status(401)
                            .error("Unauthorized")
                            .message("Invalid email or password")
                            .path("/auth/login")
                            .timestamp(LocalDateTime.now())
                            .build()
            );
        } catch (EmailNotVerifiedException ex) {
            return ResponseEntity.status(403).body(
                    ErrorResponse.builder()
                            .status(403).error("Forbidden")
                            .message(ex.getMessage())
                            .path("/auth/login")
                            .timestamp(LocalDateTime.now()).build()
            );
        }
    }


    @GetMapping("/verify-email")
    public ResponseEntity<?> verifyEmail(@RequestParam String token){
        try{
            authService.verifyEmail(token);
            return ResponseEntity.ok().build();
        } catch (ResourceNotFoundException | InvalidOperationException ex) {
            return ResponseEntity.status(400).body(
                    ErrorResponse.builder()
                            .status(400).error("Bad Request")
                            .message(ex.getMessage())
                            .path("/auth/verify-email")
                            .timestamp(LocalDateTime.now()).build()
            );
        }
    }

    @PostMapping("/forgot-password")
    public ResponseEntity<?> forgotPassword(@Valid @RequestBody ForgotPasswordRequest request) {
        authService.forgotPassword(request);
        return ResponseEntity.ok().build();
    }

    @PostMapping("/reset-password")
    public ResponseEntity<?> resetPassword(@Valid @RequestBody ResetPasswordRequest request) {
        try{
            authService.resetPassword(request);
            return ResponseEntity.ok().build();
        } catch (ResourceNotFoundException | InvalidOperationException ex) {
            return ResponseEntity.status(400).body(
                    ErrorResponse.builder()
                            .status(400).error("Bad Request")
                            .message(ex.getMessage())
                            .path("/auth/reset-password")
                            .timestamp(LocalDateTime.now()).build()
            );
        }
    }

    @PostMapping("/change-password")
    public ResponseEntity<?> changePassword(@RequestHeader("X-User-Id") Long userId, @Valid @RequestBody ChangePasswordRequest request) {
        try{
            authService.changePassword(userId, request);
            return ResponseEntity.ok().build();
        } catch(BadCredentialsException ex){
            return ResponseEntity.status(401).body(
                    ErrorResponse.builder().status(401).error("Unauthorized")
                            .message(ex.getMessage()).path("/auth/change-password")
                            .timestamp(LocalDateTime.now()).build()
            );
        }
    }

    @PostMapping("/resend-verification")
    public ResponseEntity<?> resendVerification(@Valid @RequestBody ForgotPasswordRequest request) {
        authService.resendVerification(request);
        return ResponseEntity.ok().build();
    }
}
