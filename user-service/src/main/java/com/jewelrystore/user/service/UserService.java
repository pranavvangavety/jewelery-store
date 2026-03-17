package com.jewelrystore.user.service;

import com.jewelrystore.user.dto.AddressRequest;
import com.jewelrystore.user.dto.AddressResponse;
import com.jewelrystore.user.dto.UpdateProfileRequest;
import com.jewelrystore.user.dto.UserProfileResponse;
import com.jewelrystore.user.entity.Address;
import com.jewelrystore.user.entity.UserProfile;
import com.jewelrystore.user.event.UserRegisteredEvent;
import com.jewelrystore.user.exception.ResourceNotFoundException;
import com.jewelrystore.user.repository.AddressRepository;
import com.jewelrystore.user.repository.UserProfileRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class UserService {

    private final UserProfileRepository userProfileRepository;
    private final AddressRepository addressRepository;

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

    @Transactional
    public UserProfileResponse getProfileByAuthId(Long authId) {
        UserProfile profile = userProfileRepository.findByAuthId(authId)
                .orElseThrow(() -> new ResourceNotFoundException("Profile not found for authId: " + authId));

        return mapToResponse(profile);
    }

    @Transactional
    public UserProfileResponse updateProfile(Long authId, UpdateProfileRequest request) {
        UserProfile profile = userProfileRepository.findByAuthId(authId)
                .orElseThrow(() -> new ResourceNotFoundException("Profile not found for authId: " + authId));

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
                        .defaultAddress(address.isDefaultAddress())
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

    @Transactional
    public AddressResponse addAddress(Long authId, AddressRequest request) {
        UserProfile profile = userProfileRepository.findByAuthId(authId)
                .orElseThrow(() -> new ResourceNotFoundException("Profile not found for authId: " + authId));

        if(request.isDefaultAddress()) {
            profile.getAddresses().forEach(a -> a.setDefaultAddress(false));
            userProfileRepository.save(profile);
        }

        Address address = Address.builder()
                .userProfile(profile)
                .street(request.getStreet())
                .city(request.getCity())
                .state(request.getState())
                .zipCode(request.getZipCode())
                .country(request.getCountry())
                .defaultAddress(request.isDefaultAddress())
                .build();

        Address saved = addressRepository.save(address);

        return AddressResponse.builder()
                .id(saved.getId())
                .street(saved.getStreet())
                .city(saved.getCity())
                .state(saved.getState())
                .zipCode(saved.getZipCode())
                .country(saved.getCountry())
                .defaultAddress(saved.isDefaultAddress())
                .build();
    }

    @Transactional
    public void deleteAddress(Long authId, Long addressId) {
        UserProfile profile = userProfileRepository.findByAuthId(authId)
                .orElseThrow(() -> new ResourceNotFoundException("Profile not found for authId: " + authId));

        Address toDelete = profile.getAddresses().stream()
                        .filter(a -> a.getId().equals(addressId))
                                .findFirst()
                                        .orElseThrow(() -> new ResourceNotFoundException("Addresss not found with id: " + addressId));

        boolean wasDefault = toDelete.isDefaultAddress();
        profile.getAddresses().remove(toDelete);

        if( wasDefault && !profile.getAddresses().isEmpty()) {
            profile.getAddresses().get(0).setDefaultAddress(true);
        }

        userProfileRepository.save(profile);
    }

    @Transactional
    public UserProfileResponse setDefaultAddress(Long authId, Long addressId) {
        UserProfile profile = userProfileRepository.findByAuthId(authId)
                .orElseThrow(() -> new ResourceNotFoundException("Profile not found with authId: " + authId));

        boolean found = profile.getAddresses().stream()
                .anyMatch(a -> a.getId().equals(addressId));


        if(!found) {
            throw new ResourceNotFoundException("Address not found with id: " + addressId);
        }

        profile.getAddresses().forEach(a -> a.setDefaultAddress(a.getId().equals(addressId)));
        userProfileRepository.save(profile);

        return mapToResponse(profile);
    }

    @Transactional
    public AddressResponse getAddressById(Long addressId) {
        Address address = addressRepository.findById(addressId)
                .orElseThrow(() -> new ResourceNotFoundException("Address not found: " + addressId));

        return AddressResponse.builder()
                .id(address.getId())
                .street(address.getStreet())
                .city(address.getCity())
                .state(address.getState())
                .zipCode(address.getZipCode())
                .country(address.getCountry())
                .defaultAddress(address.isDefaultAddress())
                .build();
    }




}
