package com.jewelrystore.notification.service;

import com.jewelrystore.notification.event.EmailVerificationEvent;
import com.jewelrystore.notification.event.PasswordChangedEvent;
import com.jewelrystore.notification.event.PasswordResetEvent;
import com.jewelrystore.notification.event.UserRegisteredEvent;
import jakarta.mail.internet.MimeMessage;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
@Slf4j
public class NotificationService {

    private final JavaMailSender mailSender;

    @Value("${app.mail.from}")
    private String fromEmail;

    public void sendEmailVerification(EmailVerificationEvent event) {
        String subject ="Verify your Trinket Story account";
        String body = "<h2>Welcome to Trinket Story, " + event.getFirstName() + "!</h2>"
                + "<p> Please verify your email by clicking the link below:</p>"
                + "<a href='http://localhost:5173/verify-email?token=" + event.getToken()  + "'> Verify Email</a>"
                + "<p>This link expires in 24 hours.</p>";
        sendEmail(event.getEmail(), subject, body);
    }

    public void sendPasswordReset(PasswordResetEvent event) {
        String subject = "Reset your Trinket Story password";
        String body = "<h2>Hi " + event.getFirstName() + ",</h2>"
                + "<p>Click the link below to reset your password: </p>"
                + "<a href = 'http://localhost:5173/reset-password?token=" + event.getToken() + "'>Reset Password</a>"
                + "<p>This link expires in 15 minutes.</p>";
        sendEmail(event.getEmail(), subject, body);
    }

    public void sendWelcome(UserRegisteredEvent event) {
        String subject = "Welcome to Trinket Story!";
        String body = "<h2>Hi " + event.getFirstName() + ",</h2>"
                +"<p>Welcome to Trinket Story. We're glad to have you join us.</p>"
                + "<p>Start exploring our collection today.</p>";
        sendEmail(event.getEmail(), subject, body);
    }

    public void sendPasswordChanged(PasswordChangedEvent event) {
        String subject = "Your Trinket Story password was changed";
        String body = "<h2>Hi " + event.getFirstName() + ",</h2>"
                + "<p>Your password was successfully changed.</p>"
                + "<p>If you didn't do this, please contact us immediately.</p>";
        sendEmail(event.getEmail(), subject, body);
    }

    private void sendEmail(String to, String subject, String body){
        try{
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");
            helper.setFrom(fromEmail);
            helper.setTo(to);
            helper.setSubject(subject);
            helper.setText(body, true);
            mailSender.send(message);
            log.info("Email sent to {}: {}", to, subject);
        } catch(Exception e){
            log.error("Failed to send mail to {}: {}", to, e.getMessage());
        }
    }
}
