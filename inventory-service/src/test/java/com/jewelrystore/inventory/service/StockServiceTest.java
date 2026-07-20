package com.jewelrystore.inventory.service;

import com.jewelrystore.inventory.dto.StockRequest;
import com.jewelrystore.inventory.entity.Stock;
import com.jewelrystore.inventory.exception.InvalidOperationException;
import com.jewelrystore.inventory.repository.StockRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class StockServiceTest {

    @Mock
    private StockRepository stockRepository;

    @InjectMocks
    private StockService stockService;

    @Test
    void updateStock_whenNewQuantityBelowReserved_throwsInvalidOperationException() {
        Stock stock = Stock.builder()
                .id(1L)
                .variantId(10L)
                .quantity(20)
                .reservedQuantity(5)
                .build();

        StockRequest request = new StockRequest();
        request.setVariantId(10L);
        request.setQuantity(3);

        when(stockRepository.findByVariantIdForUpdate(10L)).thenReturn(Optional.of(stock));

        assertThatThrownBy(() -> stockService.updateStock(10L, request))
                .isInstanceOf(InvalidOperationException.class);

        verify(stockRepository, never()).save(any(Stock.class));
    }

    @Test
    void updateStock_whenNewQuantityAtOrAboveReserved_succeeds() {
        Stock stock = Stock.builder()
                .id(1L)
                .variantId(10L)
                .quantity(20)
                .reservedQuantity(5)
                .build();

        StockRequest request = new StockRequest();
        request.setVariantId(10L);
        request.setQuantity(5);

        when(stockRepository.findByVariantIdForUpdate(10L)).thenReturn(Optional.of(stock));
        when(stockRepository.save(any(Stock.class))).thenAnswer(invocation -> invocation.getArgument(0));

        stockService.updateStock(10L, request);

        verify(stockRepository, times(1)).save(any(Stock.class));
    }
}
