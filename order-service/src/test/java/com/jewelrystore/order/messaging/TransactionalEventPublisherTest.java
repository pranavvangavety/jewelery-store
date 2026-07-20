package com.jewelrystore.order.messaging;

import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.transaction.support.TransactionSynchronization;
import org.springframework.transaction.support.TransactionSynchronizationManager;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;

class TransactionalEventPublisherTest {

    private KafkaTemplate<String, Object> kafkaTemplate;
    private TransactionalEventPublisher publisher;

    @BeforeEach
    @SuppressWarnings("unchecked")
    void setUp() {
        kafkaTemplate = mock(KafkaTemplate.class);
        publisher = new TransactionalEventPublisher(kafkaTemplate);
    }

    @AfterEach
    void tearDown() {
        if (TransactionSynchronizationManager.isSynchronizationActive()) {
            TransactionSynchronizationManager.clearSynchronization();
        }
    }

    @Test
    void publishAfterCommit_keyless_withNoActiveTransaction_sendsImmediately() {
        publisher.publishAfterCommit("order-placed", "payload");

        verify(kafkaTemplate).send(eq("order-placed"), eq("payload"));
    }

    @Test
    void publishAfterCommit_keyless_withActiveTransaction_defersSendUntilCommit() {
        TransactionSynchronizationManager.initSynchronization();

        publisher.publishAfterCommit("order-placed", "payload");

        verifyNoInteractions(kafkaTemplate);

        List<TransactionSynchronization> synchronizations = TransactionSynchronizationManager.getSynchronizations();
        assertThat(synchronizations).hasSize(1);

        synchronizations.get(0).afterCommit();

        verify(kafkaTemplate).send(eq("order-placed"), eq("payload"));
    }

    @Test
    void publishAfterCommit_keyless_whenTransactionRollsBack_neverSends() {
        TransactionSynchronizationManager.initSynchronization();

        publisher.publishAfterCommit("order-placed", "payload");

        TransactionSynchronizationManager.clearSynchronization();

        verifyNoInteractions(kafkaTemplate);
    }

    @Test
    void publishAfterCommit_keyed_withNoActiveTransaction_sendsImmediately() {
        publisher.publishAfterCommit("order-placed", "50", "payload");

        verify(kafkaTemplate).send(eq("order-placed"), eq("50"), eq("payload"));
    }

    @Test
    void publishAfterCommit_keyed_withActiveTransaction_defersSendUntilCommit() {
        TransactionSynchronizationManager.initSynchronization();

        publisher.publishAfterCommit("order-placed", "50", "payload");

        verifyNoInteractions(kafkaTemplate);

        List<TransactionSynchronization> synchronizations = TransactionSynchronizationManager.getSynchronizations();
        assertThat(synchronizations).hasSize(1);

        synchronizations.get(0).afterCommit();

        verify(kafkaTemplate).send(eq("order-placed"), eq("50"), eq("payload"));
    }

    @Test
    void publishAfterCommit_keyed_whenTransactionRollsBack_neverSends() {
        TransactionSynchronizationManager.initSynchronization();

        publisher.publishAfterCommit("order-placed", "50", "payload");

        TransactionSynchronizationManager.clearSynchronization();

        verifyNoInteractions(kafkaTemplate);
    }
}
