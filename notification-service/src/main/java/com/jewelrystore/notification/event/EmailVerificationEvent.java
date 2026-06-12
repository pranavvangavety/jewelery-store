package com.jewelrystore.notification.event;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class EmailVerificationEvent {
    private String email;
    private String firstName;
    private String token;
}
