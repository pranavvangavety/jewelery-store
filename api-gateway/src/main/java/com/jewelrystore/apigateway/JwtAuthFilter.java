package com.jewelrystore.apigateway;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.cloud.gateway.filter.GatewayFilterChain;
import org.springframework.cloud.gateway.filter.GlobalFilter;
import org.springframework.core.Ordered;
import org.springframework.http.HttpMethod;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;
import org.springframework.web.server.ServerWebExchange;
import reactor.core.publisher.Mono;

import java.nio.charset.StandardCharsets;
import java.util.List;

@Slf4j
@Component
public class JwtAuthFilter implements GlobalFilter, Ordered {

    @Value("${jwt.secret}")
    private String jwtSecret;

    private static final List<String> PUBLIC_PATHS = List.of(
            "/api/auth/login",
            "/api/auth/register"
    );

    private static final List<String> PUBLIC_GET_PATHS = List.of(
            "/api/products",
            "/api/categories"
    );

    private static final List<String> OPTIONAL_PATHS = List.of(
            "/api/cart"
    );

    @Override
    public Mono<Void> filter(ServerWebExchange exchange, GatewayFilterChain chain) {
        String path = exchange.getRequest().getURI().getPath();
        HttpMethod method = exchange.getRequest().getMethod();

        if(isPublicPath(path)) {
            return chain.filter(exchange);
        }

        if(HttpMethod.GET.equals(method) && isPublicGetPath(path)) {
            return chain.filter(exchange);
        }

        String authHeader = exchange.getRequest().getHeaders().getFirst("Authorization");

        if(isOptionalPath(path)) {
            if(authHeader == null || !authHeader.startsWith("Bearer ")) {
                return chain.filter(exchange);
            }

            return validateAndForward(exchange, chain, authHeader);
        }

        if(authHeader == null || !authHeader.startsWith("Bearer ")) {
            exchange.getResponse().setStatusCode(HttpStatus.UNAUTHORIZED);
            return exchange.getResponse().setComplete();
        }

        return validateAndForward(exchange, chain, authHeader);

    }

    private Mono<Void> validateAndForward(ServerWebExchange exchange, GatewayFilterChain chain, String authHeader) {
        try {
            String token = authHeader.substring(7);
            Claims claims = Jwts.parser()
                    .verifyWith(Keys.hmacShaKeyFor(jwtSecret.getBytes(StandardCharsets.UTF_8)))
                    .build()
                    .parseSignedClaims(token)
                    .getPayload();

            String userId = claims.get("userId", Long.class).toString();
            String role = claims.get("role", String.class);
            log.info("Extracted userId: {}, role: {}, forwarding headers", userId, role);

            ServerWebExchange modifiedExchange = exchange.mutate()
                    .request(r -> r.header("X-User-Id", userId).header("X-User_Role", role))
                    .build();

            return chain.filter(modifiedExchange);
        } catch (Exception e) {
            exchange.getResponse().setStatusCode(HttpStatus.UNAUTHORIZED);
            log.error("JWT validation failed: {}", e.getMessage());
            return exchange.getResponse().setComplete();
        }
    }

    private boolean isPublicPath(String path) {
        return PUBLIC_PATHS.stream().anyMatch(path::startsWith);
    }

    private boolean isPublicGetPath(String path) {
        return PUBLIC_GET_PATHS.stream().anyMatch(path::startsWith);
    }

    private boolean isOptionalPath(String path) {
        return OPTIONAL_PATHS.stream().anyMatch(path::startsWith);
    }

    @Override
    public int getOrder() {
        return -1;
    }
}
