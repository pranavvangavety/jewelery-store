package com.jewelrystore.inventory.repository;

import com.jewelrystore.inventory.entity.Stock;
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
class StockRepositoryTest {

    @Container
    @ServiceConnection
    static PostgreSQLContainer<?> postgres = new PostgreSQLContainer<>("postgres:17-alpine");

    @Autowired private StockRepository stockRepository;

    @Test
    void findByVariantIdForUpdate_existingVariant_returnsRow() {
        stockRepository.save(Stock.builder()
                .variantId(100L)
                .quantity(5)
                .reservedQuantity(0)
                .build());

        var found = stockRepository.findByVariantIdForUpdate(100L);

        assertThat(found).isPresent();
        assertThat(found.get().getVariantId()).isEqualTo(100L);
        assertThat(found.get().getQuantity()).isEqualTo(5);
    }

    @Test
    void findByVariantIdForUpdate_missingVariant_returnsEmpty() {
        var found = stockRepository.findByVariantIdForUpdate(999L);

        assertThat(found).isEmpty();
    }

    // confirms the pessimistic lock query executes without error outside a transaction issue
    @Test
    void findByVariantIdForUpdate_underLock_executesCleanly() {
        stockRepository.save(Stock.builder()
                .variantId(200L)
                .quantity(1)
                .reservedQuantity(0)
                .build());

        var first = stockRepository.findByVariantIdForUpdate(200L);
        assertThat(first).isPresent();

        var second = stockRepository.findByVariantIdForUpdate(200L);
        assertThat(second).isPresent();
        assertThat(second.get().getId()).isEqualTo(first.get().getId());
    }
}
