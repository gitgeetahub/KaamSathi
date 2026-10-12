package com.kaamsathi.service;

import com.kaamsathi.model.Account;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.util.Date;

@Service
public class TokenService {
    private final SecretKey key;

    public TokenService(@Value("${kaamsathi.jwt-secret}") String secret) {
        if (secret == null || secret.getBytes(StandardCharsets.UTF_8).length < 32) {
            throw new IllegalStateException("JWT_SECRET must contain at least 32 characters.");
        }
        this.key = Keys.hmacShaKeyFor(secret.getBytes(StandardCharsets.UTF_8));
    }

    public String create(Account account) {
        return Jwts.builder()
                .subject(String.valueOf(account.id))
                .claim("role", account.role)
                .claim("worker_id", account.worker == null ? null : account.worker.getId())
                .issuedAt(new Date())
                .expiration(new Date(System.currentTimeMillis() + 12 * 60 * 60 * 1000L))
                .signWith(key)
                .compact();
    }

    public Claims verify(String token) {
        return Jwts.parser().verifyWith(key).build().parseSignedClaims(token).getPayload();
    }
}
