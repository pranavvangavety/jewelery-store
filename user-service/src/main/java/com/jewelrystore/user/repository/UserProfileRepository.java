package com.jewelrystore.user.repository;

import com.jewelrystore.user.entity.UserProfile;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface UserProfileRepository extends JpaRepository<UserProfile, Long> {
    Optional<UserProfile> findByAuthId(Long authId);
    Optional<UserProfile> findByEmail(String email);
    boolean existsByEmail(String email);
}
