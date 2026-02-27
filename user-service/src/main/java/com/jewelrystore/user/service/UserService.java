package com.jewelrystore.user.service;

import com.jewelrystore.user.dto.AddressResponse;
import com.jewelrystore.user.dto.UpdateProfileRequest;
import com.jewelrystore.user.dto.UserProfileResponse;
import com.jewelrystore.user.entity.UserProfile;
import com.jewelrystore.user.event.UserRegisteredEvent;
import com.jewelrystore.user.repository.UserProfileRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class UserService {

    private final UserProfileRepository userProfileRepository;

    @KafkaListener(topics = "user-registered", groupId = "user-service-group")
    public void handleUserRegistered(UserRegisteredEvent event) {
        log.info("Received user registered event for email : {}", event.getEmail());

        if(userProfileRepository.existsByEmail(event.getEmail())) {
            log.warn("UserProfile already exists for email : {}", event.getEmail());
            return;
        }

        UserProfile profile = UserProfile.builder()
                .authId(event.getUserId())
                .firstName(event.getFirstName())
                .lastName(event.getLastName())
                .email(event.getEmail())
                .build();

        userProfileRepository.save(profile);
        log.info("Created UserProfile for email : {}", event.getEmail());
    }

    public UserProfileResponse getProfileByAuthId(Long authId) {
        UserProfile profile = userProfileRepository.findByAuthId(authId)
                .orElseThrow(() -> new RuntimeException("Profile not found for authId: " + authId));

        return mapToResponse(profile);
    }

    public UserProfileResponse updateProfile(Long authId, UpdateProfileRequest request) {
        UserProfile profile = userProfileRepository.findByAuthId(authId)
                .orElseThrow(() -> new RuntimeException("Profile not found for authId: " + authId));

        if(request.getFirstName() != null) {
            profile.setFirstName(request.getFirstName());
        }
        if(request.getLastName() != null) {
            profile.setLastName(request.getLastName());
        }
        if(request.getPhone() != null) {
            profile.setPhone(request.getPhone());
        }

        userProfileRepository.save(profile);
        return mapToResponse(profile);
    }

    private UserProfileResponse mapToResponse(UserProfile profile) {
        List<AddressResponse> addresses = profile.getAddresses().stream()
                .map(address -> AddressResponse.builder()
                        .id(address.getId())
                        .street(address.getStreet())
                        .city(address.getCity())
                        .state(address.getState())
                        .zipCode(address.getZipCode())
                        .country(address.getCountry())
                        .isDefault(address.isDefault())
                        .build())
                .collect(Collectors.toList());

        return UserProfileResponse.builder()
                .id(profile.getId())
                .authId(profile.getAuthId())
                .firstName(profile.getFirstName())
                .lastName(profile.getLastName())
                .email(profile.getEmail())
                .phone(profile.getPhone())
                .addresses(addresses)
                .build();
    }


}
