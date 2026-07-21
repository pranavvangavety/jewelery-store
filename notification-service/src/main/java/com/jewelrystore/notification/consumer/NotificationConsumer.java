package com.jewelrystore.notification.consumer;

import com.jewelrystore.notification.event.EmailVerificationEvent;
import com.jewelrystore.notification.event.PasswordChangedEvent;
import com.jewelrystore.notification.event.PasswordResetEvent;
import com.jewelrystore.notification.event.UserRegisteredEvent;
import com.jewelrystore.notification.service.NotificationService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
@Slf4j
public class NotificationConsumer {

    private final NotificationService notificationService;

    @KafkaListener(topics = "email-verification", groupId = "notification-service-group")
    public void handleEmailVerification(EmailVerificationEvent event) {
        log.info("Received email-verification event");
        notificationService.sendEmailVerification(event);
    }

    @KafkaListener(topics = "password-reset-requested", groupId = "notification-service-group")
    public void handlePasswordReset(PasswordResetEvent event) {
        log.info("Received password-reset-requested event");
        notificationService.sendPasswordReset(event);
    }

    @KafkaListener(topics = "password-changed", groupId = "notification-service-group")
    public void handlePasswordChanged(PasswordChangedEvent event) {
        log.info("Received password-changed event");
        notificationService.sendPasswordChanged(event);
    }

    @KafkaListener(topics = "user-registered", groupId = "notification-service-group")
    public void handleUserRegistered(UserRegisteredEvent event) {
        log.info("Received user-registered event for authId: {}", event.getUserId());
        notificationService.sendWelcome(event);
    }
}
