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

    @GetMapping("/{authId}")
    public ResponseEntity<UserProfileResponse> getProfile(@PathVariable Long authId)  {
        return ResponseEntity.ok(userService.getProfileByAuthId(authId));
    }

    @PutMapping("/{authId}")
    public ResponseEntity<UserProfileResponse> updateProfile(@PathVariable Long authId, @RequestBody UpdateProfileRequest request) {
        return ResponseEntity.ok(userService.updateProfile(authId, request));
    }


    @PostMapping("/{authId}/addresses")
    public ResponseEntity<AddressResponse> addAddress(@PathVariable Long authId, @Valid @RequestBody AddressRequest request) {
        return ResponseEntity.ok(userService.addAddress(authId, request));
    }

    @DeleteMapping("/{authId}/addresses/{addressId}")
    public ResponseEntity<Void> deleteAddress(@PathVariable Long authId, @PathVariable Long addressId) {
        userService.deleteAddress(authId, addressId);
        return ResponseEntity.noContent().build();
    }


    @PatchMapping("{authId}/addresses/{addressId}/default")
    public ResponseEntity<UserProfileResponse> setDefaultAddress(@PathVariable Long authId, @PathVariable Long addressId) {
        return ResponseEntity.ok(userService.setDefaultAddress(authId, addressId));
    }
}
