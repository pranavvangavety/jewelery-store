package com.jewelrystore.order.messaging;

import lombok.RequiredArgsConstructor;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.stereotype.Component;
import org.springframework.transaction.support.TransactionSynchronization;
import org.springframework.transaction.support.TransactionSynchronizationManager;

@Component
@RequiredArgsConstructor
public class TransactionalEventPublisher {

    private final KafkaTemplate<String, Object> kafkaTemplate;

    public void publishAfterCommit(String topic, Object payload) {
        publishAfterCommit(topic, null, payload);
    }

    public void publishAfterCommit(String topic, String key, Object payload) {
        if (TransactionSynchronizationManager.isSynchronizationActive()) {
            TransactionSynchronizationManager.registerSynchronization(new TransactionSynchronization() {
                @Override
                public void afterCommit() {
                    send(topic, key, payload);
                }
            });
        } else {
            send(topic, key, payload);
        }
    }

    private void send(String topic, String key, Object payload) {
        if (key != null) {
            kafkaTemplate.send(topic, key, payload);
        } else {
            kafkaTemplate.send(topic, payload);
        }
    }
}
