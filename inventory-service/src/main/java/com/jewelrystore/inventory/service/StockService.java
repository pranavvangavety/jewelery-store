package com.jewelrystore.inventory.service;

import com.jewelrystore.inventory.dto.ReservationRequest;
import com.jewelrystore.inventory.dto.StockRequest;
import com.jewelrystore.inventory.dto.StockResponse;
import com.jewelrystore.inventory.entity.Stock;
import com.jewelrystore.inventory.repository.StockRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class StockService {

    private final StockRepository stockRepository;

    @Transactional
    public StockResponse createStock(StockRequest request) {
        if(stockRepository.existsByVariantId(request.getVariantId())) {
            throw new RuntimeException("Stock already exists for variantId: " + request.getVariantId());
        }

        Stock stock  = Stock.builder()
                .variantId(request.getVariantId())
                .quantity(request.getQuantity())
                .reservedQuantity(0)
                .build();

        Stock saved = stockRepository.save(stock);
        log.info("Created stock for variantId: {}", request.getVariantId());
        return mapToResponse(saved);
    }


    @Transactional
    public StockResponse updateStock(Long variantId, StockRequest request) {
        Stock stock = stockRepository.findByVariantId(variantId)
                .orElseThrow(() -> new RuntimeException("Stock not found for variantId: " + variantId));

        stock.setQuantity(request.getQuantity());
        stockRepository.save(stock);
        log.info("Updated stock for variantId: {}", variantId);
        return mapToResponse(stock);
    }

    @Transactional(readOnly = true)
    public StockResponse getStock(Long variantId) {
        Stock stock = stockRepository.findByVariantId(variantId)
                .orElseThrow(() -> new RuntimeException("Stock not found for variantId: " + variantId));
        return mapToResponse(stock);
    }


    @Transactional(readOnly = true)
    public List<StockResponse> getBatchStock(List<Long> variantIds) {
        return stockRepository.findByVariantIdIn(variantIds)
                .stream().map(this::mapToResponse).toList();
    }

    @Transactional
    public StockResponse reserve(Long variantId, ReservationRequest request) {
        Stock stock = stockRepository.findByVariantId(variantId)
                .orElseThrow(() -> new RuntimeException("Stock not found for variantId: " + variantId));

        int available = stock.getQuantity() - stock.getReservedQuantity();
        if(available< request.getQuantity()) {
            throw new RuntimeException("Insufficient stock for variantId: " + variantId);
        }

        stock.setReservedQuantity(stock.getReservedQuantity() + request.getQuantity());
        stockRepository.save(stock);
        log.info("Reserved {} units for variantId: {}", request.getQuantity(), variantId);
        return mapToResponse(stock);
    }

    @Transactional
    public StockResponse release(Long variantId, ReservationRequest request) {
        Stock stock = stockRepository.findByVariantId(variantId)
                .orElseThrow(() -> new RuntimeException("Stock not found for variantId: " + variantId));

        int newReserved = stock.getReservedQuantity()  - request.getQuantity();
        if(newReserved<0) {
            throw new RuntimeException("Cannot release more than reserved stock for variantId: " + variantId);
        }

        stock.setReservedQuantity(newReserved);
        stockRepository.save(stock);
        log.info("Released {} units for variantId: {}", request.getQuantity(), variantId);
        return mapToResponse(stock);
    }

    @Transactional
    public StockResponse confirm(Long variantId, ReservationRequest request) {
        Stock stock = stockRepository.findByVariantId(variantId)
                .orElseThrow(() -> new RuntimeException("Stock not found for variantId: " + variantId));

        if(stock.getReservedQuantity() < request.getQuantity()) {
            throw new RuntimeException("Cannot confirm more than reserved stock for variantId: " + variantId);
        }

        stock.setQuantity(stock.getQuantity() - request.getQuantity());
        stock.setReservedQuantity(stock.getReservedQuantity() - request.getQuantity());
        stockRepository.save(stock);
        log.info("Confirmed {} units for variantId: {}", request.getQuantity(), variantId);
        return mapToResponse(stock);
    }




    private StockResponse mapToResponse(Stock stock) {
        return StockResponse.builder()
                .variantId(stock.getVariantId())
                .quantity(stock.getQuantity())
                .reservedQuantity(stock.getReservedQuantity())
                .availableQuantity(stock.getQuantity() - stock.getReservedQuantity())
                .build();
    }
}
