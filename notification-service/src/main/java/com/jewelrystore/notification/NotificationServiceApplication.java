package com.jewelrystore.notification;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.cloud.client.discovery.EnableDiscoveryClient;
import org.springframework.context.annotation.Bean;
import org.springframework.kafka.support.converter.ByteArrayJsonMessageConverter;

@SpringBootApplication
@EnableDiscoveryClient
public class NotificationServiceApplication {

    public static void main(String[] args) {

        SpringApplication.run(NotificationServiceApplication.class, args);


    }

    @Bean
    public ByteArrayJsonMessageConverter jsonMessageConverter() {
        return new ByteArrayJsonMessageConverter();
    }



}
