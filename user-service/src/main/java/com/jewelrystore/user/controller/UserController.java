package com.jewelrystore.user.controller;

import com.jewelrystore.user.dto.AddressRequest;
import com.jewelrystore.user.dto.AddressResponse;
import com.jewelrystore.user.dto.UpdateProfileRequest;
import com.jewelrystore.user.dto.UserProfileResponse;
import com.jewelrystore.user.service.UserService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/users")
@RequiredArgsConstructor
public class UserController {

    private final UserService userService;

    @GetMapping("/me")
    public ResponseEntity<UserProfileResponse> getProfile(
            @RequestHeader("X-User-Id") Long authId) {
        return ResponseEntity.ok(userService.getProfileByAuthId(authId));
    }

    @PutMapping("/me")
    public ResponseEntity<UserProfileResponse> updateProfile(
            @RequestHeader("X-User-Id") Long authId,
            @RequestBody UpdateProfileRequest request) {
        return ResponseEntity.ok(userService.updateProfile(authId, request));
    }

    @PostMapping("/me/addresses")
    public ResponseEntity<AddressResponse> addAddress(
            @RequestHeader("X-User-Id") Long authId,
            @Valid @RequestBody AddressRequest request) {
        return ResponseEntity.ok(userService.addAddress(authId, request));
    }

    @DeleteMapping("/me/addresses/{addressId}")
    public ResponseEntity<Void> deleteAddress(
            @RequestHeader("X-User-Id") Long authId,
            @PathVariable Long addressId) {
        userService.deleteAddress(authId, addressId);
        return ResponseEntity.noContent().build();
    }

    @PatchMapping("/me/addresses/{addressId}/default")
    public ResponseEntity<UserProfileResponse> setDefaultAddress(
            @RequestHeader("X-User-Id") Long authId,
            @PathVariable Long addressId) {
        return ResponseEntity.ok(userService.setDefaultAddress(authId, addressId));
    }


    @GetMapping("/addresses/{addressId}")
    public ResponseEntity<AddressResponse> getAddressById(
            @PathVariable Long addressId) {
        return ResponseEntity.ok(userService.getAddressById(addressId));
    }
}