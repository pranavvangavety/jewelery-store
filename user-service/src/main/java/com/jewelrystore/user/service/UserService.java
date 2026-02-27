package com.jewelrystore.user.service;

import com.jewelrystore.user.entity.UserProfile;
import com.jewelrystore.user.event.UserRegisteredEvent;
import com.jewelrystore.user.repository.UserProfileRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.stereotype.Service;

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
}
