package com.jewelrystore.inventory.listener;

import com.jewelrystore.inventory.dto.StockRequest;
import com.jewelrystore.inventory.event.VariantCreatedEvent;
import com.jewelrystore.inventory.service.StockService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
@Slf4j
public class VariantEventListener {

    private final StockService stockService;

    @KafkaListener(topics = "variant-created", groupId = "inventory-service-group")
    public void handleVariantCreated(VariantCreatedEvent event){
        log.info("Received VariantCreatedEvent for variantId: {}", event.getVariantId());

        if(stockService.stockExists(event.getVariantId())){
            log.warn("Stock already exists for variantId: {}, skipping to prevent duplication", event.getVariantId());
            return;
        }

        StockRequest request = new StockRequest();
        request.setVariantId(event.getVariantId());
        request.setQuantity(0);
        stockService.createStock(request);
        log.info("Initialized stock to 0 for variantId: {}", event.getVariantId());
    }
}
