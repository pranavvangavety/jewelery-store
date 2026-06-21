package com.jewelrystore.apigateway;

import org.junit.jupiter.api.Test;
import org.springframework.cloud.gateway.filter.GatewayFilterChain;
import org.springframework.mock.http.server.reactive.MockServerHttpRequest;
import org.springframework.mock.web.server.MockServerWebExchange;
import org.springframework.web.server.ServerWebExchange;
import reactor.core.publisher.Mono;

import java.util.concurrent.atomic.AtomicReference;

import static org.assertj.core.api.Assertions.assertThat;

public class JwtAuthFilterTest {

    @Test
    void forgedUserIdHeaderIsStrippedOnUnauthenticatedCartRequest() {
        JwtAuthFilter filter = new JwtAuthFilter();

        MockServerHttpRequest request = MockServerHttpRequest
                .get("/api/cart")
                .header("X-User-Id", "5")
                .build();
        MockServerWebExchange exchange = MockServerWebExchange.from(request);

        AtomicReference<ServerWebExchange> forwarded = new AtomicReference<>();
        GatewayFilterChain chain = ex -> {
            forwarded.set(ex);
            return Mono.empty();
        };

        filter.filter(exchange, chain).block();

        assertThat(forwarded.get()).isNotNull();
        assertThat(forwarded.get().getRequest().getHeaders().getFirst("X-User-Id"))
                .as("forged X-User-Id must not reach downstream cart service")
                .isNull();
    }
}
