package com.elevoraai.config;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.JwtException;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import jakarta.annotation.PostConstruct;
import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.time.Instant;
import java.util.Date;
import javax.crypto.SecretKey;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseCookie;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;

@Component
public class JwtUtil {

    private static final String TOKEN_TYPE_CLAIM = "token_type";
    private static final String ACCESS_TOKEN_TYPE = "access";
    private static final String REFRESH_TOKEN_TYPE = "refresh";
    private static final String TENANT_ID_CLAIM = "tenant_id";
    private static final String ROLE_CLAIM = "role";
    private static final int MINIMUM_SECRET_BYTES = 64;

    private final String jwtSecret;
    private final long accessTokenExpirySeconds;
    private final long refreshTokenExpirySeconds;
    private final String accessCookieName;
    private final String refreshCookieName;
    private final boolean cookieSecure;
    private final String cookieSameSite;

    private SecretKey signingKey;

    public JwtUtil(
            @Value("${app.jwt.secret}") String jwtSecret,
            @Value("${app.jwt.access-token-expiry-seconds:900}") long accessTokenExpirySeconds,
            @Value("${app.jwt.refresh-token-expiry-seconds:604800}") long refreshTokenExpirySeconds,
            @Value("${app.jwt.access-cookie-name:elevora_access_token}") String accessCookieName,
            @Value("${app.jwt.refresh-cookie-name:elevora_refresh_token}") String refreshCookieName,
            @Value("${app.security.cookie.secure:false}") boolean cookieSecure,
            @Value("${app.security.cookie.same-site:Strict}") String cookieSameSite) {
        this.jwtSecret = jwtSecret;
        this.accessTokenExpirySeconds = accessTokenExpirySeconds;
        this.refreshTokenExpirySeconds = refreshTokenExpirySeconds;
        this.accessCookieName = accessCookieName;
        this.refreshCookieName = refreshCookieName;
        this.cookieSecure = cookieSecure;
        this.cookieSameSite = cookieSameSite;
    }

    @PostConstruct
    void initializeSigningKey() {
        if (!StringUtils.hasText(jwtSecret)) {
            throw new IllegalStateException("JWT secret is required");
        }

        byte[] secretBytes = jwtSecret.getBytes(StandardCharsets.UTF_8);
        if (secretBytes.length < MINIMUM_SECRET_BYTES) {
            throw new IllegalStateException("JWT secret must be at least 64 bytes");
        }

        this.signingKey = Keys.hmacShaKeyFor(secretBytes);
    }

    public String generateAccessToken(Long userId, Long tenantId, String email, String role) {
        return generateToken(userId, tenantId, email, role, ACCESS_TOKEN_TYPE, accessTokenExpirySeconds);
    }

    public String generateRefreshToken(Long userId, Long tenantId, String email, String role) {
        return generateToken(userId, tenantId, email, role, REFRESH_TOKEN_TYPE, refreshTokenExpirySeconds);
    }

    public boolean isValidAccessToken(String token) {
        return isValidTokenOfType(token, ACCESS_TOKEN_TYPE);
    }

    public boolean isValidRefreshToken(String token) {
        return isValidTokenOfType(token, REFRESH_TOKEN_TYPE);
    }

    public Claims parseClaims(String token) {
        return Jwts.parser()
                .verifyWith(signingKey)
                .build()
                .parseSignedClaims(token)
                .getPayload();
    }

    public Long extractUserId(String token) {
        return Long.valueOf(parseClaims(token).getSubject());
    }

    public Long extractTenantId(String token) {
        return parseClaims(token).get(TENANT_ID_CLAIM, Long.class);
    }

    public String extractEmail(String token) {
        return parseClaims(token).get("email", String.class);
    }

    public String extractRole(String token) {
        return parseClaims(token).get(ROLE_CLAIM, String.class);
    }

    public ResponseCookie createAccessTokenCookie(String token) {
        return createHttpOnlyCookie(accessCookieName, token, Duration.ofSeconds(accessTokenExpirySeconds));
    }

    public ResponseCookie createRefreshTokenCookie(String token) {
        return createHttpOnlyCookie(refreshCookieName, token, Duration.ofSeconds(refreshTokenExpirySeconds));
    }

    public ResponseCookie clearAccessTokenCookie() {
        return clearCookie(accessCookieName);
    }

    public ResponseCookie clearRefreshTokenCookie() {
        return clearCookie(refreshCookieName);
    }

    public String getAccessCookieName() {
        return accessCookieName;
    }

    public String getRefreshCookieName() {
        return refreshCookieName;
    }

    public long getAccessTokenExpirySeconds() {
        return accessTokenExpirySeconds;
    }

    public long getRefreshTokenExpirySeconds() {
        return refreshTokenExpirySeconds;
    }

    private String generateToken(
            Long userId,
            Long tenantId,
            String email,
            String role,
            String tokenType,
            long expirySeconds) {
        if (userId == null || tenantId == null || !StringUtils.hasText(email) || !StringUtils.hasText(role)) {
            throw new IllegalArgumentException("User id, tenant id, email, and role are required for JWT generation");
        }

        Instant now = Instant.now();
        return Jwts.builder()
                .subject(String.valueOf(userId))
                .claim(TENANT_ID_CLAIM, tenantId)
                .claim("email", email)
                .claim(ROLE_CLAIM, role)
                .claim(TOKEN_TYPE_CLAIM, tokenType)
                .issuedAt(Date.from(now))
                .expiration(Date.from(now.plusSeconds(expirySeconds)))
                .signWith(signingKey)
                .compact();
    }

    private boolean isValidTokenOfType(String token, String expectedType) {
        if (!StringUtils.hasText(token)) {
            return false;
        }

        try {
            Claims claims = parseClaims(token);
            return expectedType.equals(claims.get(TOKEN_TYPE_CLAIM, String.class))
                    && claims.getExpiration() != null
                    && claims.getExpiration().after(new Date())
                    && StringUtils.hasText(claims.getSubject())
                    && claims.get(TENANT_ID_CLAIM, Long.class) != null;
        } catch (JwtException | IllegalArgumentException ex) {
            return false;
        }
    }

    private ResponseCookie createHttpOnlyCookie(String name, String value, Duration maxAge) {
        return ResponseCookie.from(name, value)
                .httpOnly(true)
                .secure(cookieSecure)
                .sameSite(cookieSameSite)
                .path("/")
                .maxAge(maxAge)
                .build();
    }

    private ResponseCookie clearCookie(String name) {
        return ResponseCookie.from(name, "")
                .httpOnly(true)
                .secure(cookieSecure)
                .sameSite(cookieSameSite)
                .path("/")
                .maxAge(Duration.ZERO)
                .build();
    }
}
