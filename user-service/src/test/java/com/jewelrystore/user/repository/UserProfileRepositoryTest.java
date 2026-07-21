package com.jewelrystore.user.repository;

import com.jewelrystore.user.entity.UserProfile;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.jdbc.AutoConfigureTestDatabase;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;
import org.springframework.boot.testcontainers.service.connection.ServiceConnection;
import org.springframework.test.context.ActiveProfiles;
import org.testcontainers.containers.PostgreSQLContainer;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;

import static org.assertj.core.api.Assertions.assertThat;

@DataJpaTest
@AutoConfigureTestDatabase(replace = AutoConfigureTestDatabase.Replace.NONE)
@ActiveProfiles("test")
@Testcontainers
class UserProfileRepositoryTest {

    @Container
    @ServiceConnection
    static PostgreSQLContainer<?> postgres = new PostgreSQLContainer<>("postgres:17-alpine");

    @Autowired private UserProfileRepository userProfileRepository;

    @Test
    void findByAuthId_existingProfile_returnsIt() {
        userProfileRepository.save(UserProfile.builder()
                .authId(42L)
                .firstName("Ada")
                .lastName("Lovelace")
                .email("ada@example.com")
                .build());

        var found = userProfileRepository.findByAuthId(42L);

        assertThat(found).isPresent();
        assertThat(found.get().getAuthId()).isEqualTo(42L);
        assertThat(found.get().getEmail()).isEqualTo("ada@example.com");
    }

    @Test
    void findByAuthId_missingAuthId_returnsEmpty() {
        var found = userProfileRepository.findByAuthId(999L);

        assertThat(found).isEmpty();
    }
}
