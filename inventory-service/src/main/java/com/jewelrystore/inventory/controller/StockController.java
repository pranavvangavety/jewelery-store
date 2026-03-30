package com.jewelrystore.inventory.controller;

import com.jewelrystore.inventory.dto.ReservationRequest;
import com.jewelrystore.inventory.dto.StockRequest;
import com.jewelrystore.inventory.dto.StockResponse;
import com.jewelrystore.inventory.service.StockService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/inventory")
@RequiredArgsConstructor
public class StockController {

    private final StockService stockService;

    @PostMapping //ADMIN
    public ResponseEntity<StockResponse> createStock(@Valid @RequestBody StockRequest request) {
        return ResponseEntity.ok(stockService.createStock(request));
    }

    @PutMapping("/{variantId}") //ADMIN
    public ResponseEntity<StockResponse> updateStock(@PathVariable Long variantId, @Valid @RequestBody StockRequest request) {
        return ResponseEntity.ok(stockService.updateStock(variantId, request));
    }

    @GetMapping("/{variantId}")
    public ResponseEntity<StockResponse> getStock(@PathVariable Long variantId) {
        return ResponseEntity.ok(stockService.getStock(variantId));
    }

    @GetMapping // ADMIN
    public ResponseEntity<List<StockResponse>> getAllStock() {
        return ResponseEntity.ok(stockService.getAllStock());
    }

    @GetMapping("/batch")
    public ResponseEntity<List<StockResponse>> getBatchStock(@RequestParam List<Long> variantIds) {
        return ResponseEntity.ok(stockService.getBatchStock(variantIds));
    }

    @PostMapping("/{variantId}/reserve")
    public ResponseEntity<StockResponse> reserve(@PathVariable Long variantId, @Valid @RequestBody ReservationRequest request) {
        return ResponseEntity.ok(stockService.reserve(variantId, request));
    }

    @PostMapping("/{variantId}/release")
    public ResponseEntity<StockResponse> release(@PathVariable Long variantId, @Valid @RequestBody ReservationRequest request) {
        return ResponseEntity.ok(stockService.release(variantId, request));
    }

    @PostMapping("/{variantId}/confirm")
    public ResponseEntity<StockResponse> confirm(@PathVariable Long variantId, @Valid @RequestBody ReservationRequest request) {
        return ResponseEntity.ok(stockService.confirm(variantId, request));
    }

}
