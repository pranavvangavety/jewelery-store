package com.jewelrystore.user.controller;

import com.jewelrystore.user.dto.UpdateProfileRequest;
import com.jewelrystore.user.dto.UserProfileResponse;
import com.jewelrystore.user.service.UserService;
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
}
