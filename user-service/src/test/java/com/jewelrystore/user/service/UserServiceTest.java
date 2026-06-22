package com.jewelrystore.user.service;

import com.jewelrystore.user.entity.UserProfile;
import com.jewelrystore.user.exception.ResourceNotFoundException;
import com.jewelrystore.user.repository.AddressRepository;
import com.jewelrystore.user.repository.UserProfileRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.ArrayList;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
public class UserServiceTest {

    @Mock
    private UserProfileRepository userProfileRepository;

    @Mock
    private AddressRepository addressRepository;

    @InjectMocks
    private UserService userService;

    @Test
    void getAddressById_whenAddressIsNotInCallersProfile_throwsNotFound(){
        UserProfile profile = UserProfile.builder()
                .authId(1L)
                .addresses(new ArrayList<>())
                .build();

        when(userProfileRepository.findByAuthId(1L)).thenReturn(Optional.of(profile));

        assertThatThrownBy(()->userService.getAddressById(1L, 99L))
                .isInstanceOf(ResourceNotFoundException.class);
    }
}
