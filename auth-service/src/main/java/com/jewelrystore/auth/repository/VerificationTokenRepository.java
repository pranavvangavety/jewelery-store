package com.jewelrystore.auth.repository;

import com.jewelrystore.auth.entity.TokenType;
import com.jewelrystore.auth.entity.VerificationToken;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface VerificationTokenRepository extends JpaRepository<VerificationToken, Long> {

    Optional<VerificationToken> findByTokenAndType(String token, TokenType type);

    void deleteByUserIdAndType(Long userId, TokenType type);
}
