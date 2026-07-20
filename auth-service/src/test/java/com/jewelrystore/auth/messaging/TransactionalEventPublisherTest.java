package com.jewelrystore.auth.messaging;

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
    void publishAfterCommit_withNoActiveTransaction_sendsImmediately() {
        publisher.publishAfterCommit("variant-created", "payload");

        verify(kafkaTemplate).send(eq("variant-created"), eq("payload"));
    }

    @Test
    void publishAfterCommit_withActiveTransaction_defersSendUntilCommit() {
        TransactionSynchronizationManager.initSynchronization();

        publisher.publishAfterCommit("variant-created", "payload");

        verifyNoInteractions(kafkaTemplate);

        List<TransactionSynchronization> synchronizations = TransactionSynchronizationManager.getSynchronizations();
        assertThat(synchronizations).hasSize(1);

        synchronizations.get(0).afterCommit();

        verify(kafkaTemplate).send(eq("variant-created"), eq("payload"));
    }

    @Test
    void publishAfterCommit_whenTransactionRollsBack_neverSends() {
        TransactionSynchronizationManager.initSynchronization();

        publisher.publishAfterCommit("variant-created", "payload");

        TransactionSynchronizationManager.clearSynchronization();

        verifyNoInteractions(kafkaTemplate);
    }
}
