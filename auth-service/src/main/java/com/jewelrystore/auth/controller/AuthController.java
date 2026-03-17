package com.jewelrystore.auth.controller;

import com.jewelrystore.auth.dto.AuthResponse;
import com.jewelrystore.auth.dto.ErrorResponse;
import com.jewelrystore.auth.dto.LoginRequest;
import com.jewelrystore.auth.dto.RegisterRequest;
import com.jewelrystore.auth.exception.DuplicateResourceException;
import com.jewelrystore.auth.exception.ResourceNotFoundException;
import com.jewelrystore.auth.service.AuthService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

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
        }
    }
}
