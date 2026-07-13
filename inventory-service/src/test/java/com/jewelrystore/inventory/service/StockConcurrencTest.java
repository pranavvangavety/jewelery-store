package com.jewelrystore.inventory.service;

import com.jewelrystore.inventory.dto.ReservationRequest;
import com.jewelrystore.inventory.entity.Stock;
import com.jewelrystore.inventory.exception.InsufficientStockException;
import com.jewelrystore.inventory.repository.StockRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.testcontainers.service.connection.ServiceConnection;
import org.springframework.test.context.ActiveProfiles;
import org.testcontainers.containers.PostgreSQLContainer;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;

import java.util.concurrent.*;
import java.util.concurrent.atomic.AtomicInteger;

import static org.assertj.core.api.Assertions.assertThat;

@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.NONE)
@ActiveProfiles("test")
@Testcontainers
class StockConcurrencyTest {

    @Container
    @ServiceConnection
    static PostgreSQLContainer<?> postgres = new PostgreSQLContainer<>("postgres:17-alpine");

    @Autowired private StockService stockService;
    @Autowired private StockRepository stockRepository;

    private static final Long VARIANT_ID = 999L;
    private static final int THREADS = 10;

    @BeforeEach
    void seedSingleUnitOfStock() {
        stockRepository.deleteAll();
        stockRepository.save(Stock.builder()
                .variantId(VARIANT_ID)
                .quantity(1)
                .reservedQuantity(0)
                .build());
    }

    @Test
    void concurrentReserves_againstStockOfOne_onlyOneSucceeds() throws Exception {
        ExecutorService pool = Executors.newFixedThreadPool(THREADS);
        CountDownLatch startGate = new CountDownLatch(1);
        CountDownLatch finished  = new CountDownLatch(THREADS);

        AtomicInteger succeeded  = new AtomicInteger();
        AtomicInteger outOfStock = new AtomicInteger();
        AtomicInteger unexpected = new AtomicInteger();

        for (int i = 0; i < THREADS; i++) {
            pool.submit(() -> {
                try {
                    startGate.await();
                    stockService.reserve(VARIANT_ID, reservationOf(1));
                    succeeded.incrementAndGet();
                } catch (InsufficientStockException e) {
                    outOfStock.incrementAndGet();
                } catch (Exception e) {
                    unexpected.incrementAndGet();
                } finally {
                    finished.countDown();
                }
            });
        }

        startGate.countDown();
        assertThat(finished.await(30, TimeUnit.SECONDS)).isTrue();
        pool.shutdown();

        assertThat(unexpected.get()).isZero();

        assertThat(succeeded.get()).isEqualTo(1);
        assertThat(outOfStock.get()).isEqualTo(THREADS - 1);

        Stock finalStock = stockRepository.findByVariantId(VARIANT_ID).orElseThrow();
        assertThat(finalStock.getReservedQuantity()).isEqualTo(1);
    }

    private static ReservationRequest reservationOf(int quantity) {
        ReservationRequest request = new ReservationRequest();
        request.setQuantity(quantity);
        return request;
    }
}