package com.jewelrystore.user.dto;

import com.jewelrystore.user.entity.Address;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UserProfileResponse {
    private Long id;
    private Long authId;
    private String firstName;
    private String lastName;
    private String email;
    private String phone;
    private List<AddressResponse> addresses;
}
