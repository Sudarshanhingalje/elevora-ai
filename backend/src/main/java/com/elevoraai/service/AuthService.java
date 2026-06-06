package com.elevoraai.service;

import com.elevoraai.config.JwtUtil;
import com.elevoraai.controller.AuthController.AuthTokens;
import com.elevoraai.controller.AuthController.ForgotPasswordRequest;
import com.elevoraai.controller.AuthController.LoginRequest;
import com.elevoraai.controller.AuthController.RegisterRequest;
import com.elevoraai.controller.AuthController.ResetPasswordRequest;
import com.elevoraai.controller.AuthController.VerifyOtpRequest;
import com.fasterxml.jackson.databind.JsonNode;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.security.SecureRandom;
import java.sql.PreparedStatement;
import java.sql.Statement;
import java.sql.Timestamp;
import java.time.Duration;
import java.time.Instant;
import java.util.Locale;
import java.util.Optional;
import java.util.UUID;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.dao.DuplicateKeyException;
import org.springframework.dao.EmptyResultDataAccessException;
import org.springframework.http.MediaType;
import org.springframework.http.HttpStatus;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.support.GeneratedKeyHolder;
import org.springframework.jdbc.support.KeyHolder;
import org.springframework.mail.MailException;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.client.RestClient;
import org.springframework.web.server.ResponseStatusException;

@Service
public class AuthService {

    private static final SecureRandom SECURE_RANDOM = new SecureRandom();
    private static final String TENANT_STATUS_ACTIVE = "ACTIVE";
    private static final String USER_ROLE = "USER";

    private final JdbcTemplate jdbcTemplate;
    private final PasswordEncoder passwordEncoder;
    private final JwtUtil jwtUtil;
    private final JavaMailSender mailSender;
    private final StringRedisTemplate redisTemplate;
    private final RestClient restClient;
    private final String mailFrom;
    private final String googleClientId;
    private final String googleClientSecret;
    private final String appBaseUrl;
    private final String frontendBaseUrl;
    private final int otpExpirySeconds;
    private final int failedLoginMaxAttempts;
    private final int failedLoginLockMinutes;

    public AuthService(
            JdbcTemplate jdbcTemplate,
            PasswordEncoder passwordEncoder,
            JwtUtil jwtUtil,
            JavaMailSender mailSender,
            StringRedisTemplate redisTemplate,
            @Value("${app.mail.from:no-reply@elevora.ai}") String mailFrom,
            @Value("${app.oauth.google.client-id:}") String googleClientId,
            @Value("${app.oauth.google.client-secret:}") String googleClientSecret,
            @Value("${app.base-url:http://localhost:8080}") String appBaseUrl,
            @Value("${app.frontend-base-url:http://localhost:3000}") String frontendBaseUrl,
            @Value("${app.otp.expiry-seconds:300}") int otpExpirySeconds,
            @Value("${app.security.failed-login.max-attempts:5}") int failedLoginMaxAttempts,
            @Value("${app.security.failed-login.lock-minutes:15}") int failedLoginLockMinutes) {
        this.jdbcTemplate = jdbcTemplate;
        this.passwordEncoder = passwordEncoder;
        this.jwtUtil = jwtUtil;
        this.mailSender = mailSender;
        this.redisTemplate = redisTemplate;
        this.restClient = RestClient.create();
        this.mailFrom = mailFrom;
        this.googleClientId = googleClientId;
        this.googleClientSecret = googleClientSecret;
        this.appBaseUrl = appBaseUrl;
        this.frontendBaseUrl = frontendBaseUrl;
        this.otpExpirySeconds = otpExpirySeconds;
        this.failedLoginMaxAttempts = failedLoginMaxAttempts;
        this.failedLoginLockMinutes = failedLoginLockMinutes;
    }

    @Transactional
    public AuthTokens register(RegisterRequest request, String ipAddress) {
        String tenantSlug = normalizeSlug(request.tenantSlug());
        String email = normalizeEmail(request.email());
        Long tenantId = findTenantIdBySlug(tenantSlug)
                .orElseGet(() -> createTenant(request.name().trim(), tenantSlug));

        if (userExists(tenantId, email)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "User already exists for this tenant");
        }

        String passwordHash = passwordEncoder.encode(request.password());
        String otp = generateOtp();
        String otpHash = passwordEncoder.encode(otp);
        Instant otpExpiry = Instant.now().plusSeconds(otpExpirySeconds);

        KeyHolder keyHolder = new GeneratedKeyHolder();
        try {
            jdbcTemplate.update(connection -> {
                PreparedStatement ps = connection.prepareStatement(
                        "INSERT INTO users (tenant_id, email, password_hash, role, otp_code, otp_expiry, is_verified, agreed_to_terms, terms_accepted_at) "
                                + "VALUES (?, ?, ?, ?, ?, ?, false, ?, ?)",
                        Statement.RETURN_GENERATED_KEYS);
                ps.setLong(1, tenantId);
                ps.setString(2, email);
                ps.setString(3, passwordHash);
                ps.setString(4, USER_ROLE);
                ps.setString(5, otpHash);
                ps.setTimestamp(6, Timestamp.from(otpExpiry));
                ps.setBoolean(7, request.agreedToTerms() != null && request.agreedToTerms());
                ps.setTimestamp(8, Timestamp.from(Instant.now()));
                return ps;
            }, keyHolder);
        } catch (DuplicateKeyException ex) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "User already exists for this tenant", ex);
        }

        Long userId = requireGeneratedId(keyHolder, "user");
        sendOtpEmail(email, otp, "Verify your Elevora AI account");
        logActivity(tenantId, userId, "AUTH_REGISTER", "users", userId, ipAddress);

        return createTokens(userId, tenantId, email, USER_ROLE, false);
    }

    @Transactional
    public AuthTokens login(LoginRequest request, String ipAddress) {
        String tenantSlug = normalizeSlug(request.tenantSlug());
        String email = normalizeEmail(request.email());
        enforceLoginNotLocked(tenantSlug, email, ipAddress);

        Long tenantId = findTenantIdBySlug(tenantSlug)
                .orElseThrow(() -> {
                    registerFailedLogin(tenantSlug, email, ipAddress);
                    return unauthorized();
                });

        UserAuthRecord user = findUserForLogin(tenantId, email)
                .orElseThrow(() -> {
                    registerFailedLogin(tenantSlug, email, ipAddress);
                    return unauthorized();
                });

        if (!passwordEncoder.matches(request.password(), user.passwordHash())) {
            registerFailedLogin(tenantSlug, email, ipAddress);
            logActivity(tenantId, user.id(), "AUTH_LOGIN_FAILED", "users", user.id(), ipAddress);
            throw unauthorized();
        }

        clearFailedLoginCounter(tenantSlug, email, ipAddress);
        logActivity(tenantId, user.id(), "AUTH_LOGIN_SUCCESS", "users", user.id(), ipAddress);
        return createTokens(user.id(), tenantId, user.email(), user.role(), user.verified());
    }

    @Transactional(readOnly = true)
    public AuthTokens refresh(String refreshToken, String ipAddress) {
        if (!jwtUtil.isValidRefreshToken(refreshToken)) {
            throw unauthorized();
        }

        Long userId = jwtUtil.extractUserId(refreshToken);
        Long tenantId = jwtUtil.extractTenantId(refreshToken);
        UserAuthRecord user = findUserByIdAndTenant(userId, tenantId)
                .orElseThrow(() -> unauthorized());

        return createTokens(user.id(), tenantId, user.email(), user.role(), user.verified());
    }

    @Transactional
    public void forgotPassword(ForgotPasswordRequest request, String ipAddress) {
        String tenantSlug = normalizeSlug(request.tenantSlug());
        String email = normalizeEmail(request.email());
        Optional<Long> tenantId = findTenantIdBySlug(tenantSlug);

        if (tenantId.isEmpty()) {
            return;
        }

        Optional<UserAuthRecord> user = findUserForLogin(tenantId.get(), email);
        if (user.isEmpty()) {
            return;
        }

        String otp = generateOtp();
        String otpHash = passwordEncoder.encode(otp);
        Instant otpExpiry = Instant.now().plusSeconds(otpExpirySeconds);

        jdbcTemplate.update(
                "UPDATE users SET otp_code = ?, otp_expiry = ?, updated_at = CURRENT_TIMESTAMP "
                        + "WHERE id = ? AND tenant_id = ? AND email = ?",
                otpHash,
                Timestamp.from(otpExpiry),
                user.get().id(),
                tenantId.get(),
                email);

        sendOtpEmail(email, otp, "Reset your Elevora AI password");
        logActivity(tenantId.get(), user.get().id(), "AUTH_FORGOT_PASSWORD", "users", user.get().id(), ipAddress);
    }

    @Transactional
    public void resetPassword(ResetPasswordRequest request, String ipAddress) {
        String tenantSlug = normalizeSlug(request.tenantSlug());
        String email = normalizeEmail(request.email());
        Long tenantId = findTenantIdBySlug(tenantSlug)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Invalid reset request"));

        OtpRecord user = findOtpRecord(tenantId, email)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Invalid reset request"));

        if (user.otpHash() == null || user.otpExpiry() == null || user.otpExpiry().isBefore(Instant.now())) {
            logActivity(tenantId, user.id(), "AUTH_PASSWORD_RESET_OTP_EXPIRED", "users", user.id(), ipAddress);
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "OTP expired");
        }

        if (!passwordEncoder.matches(request.otp(), user.otpHash())) {
            logActivity(tenantId, user.id(), "AUTH_PASSWORD_RESET_OTP_FAILED", "users", user.id(), ipAddress);
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Invalid OTP");
        }

        String passwordHash = passwordEncoder.encode(request.newPassword());
        jdbcTemplate.update(
                "UPDATE users SET password_hash = ?, otp_code = NULL, otp_expiry = NULL, updated_at = CURRENT_TIMESTAMP "
                        + "WHERE id = ? AND tenant_id = ? AND email = ?",
                passwordHash,
                user.id(),
                tenantId,
                email);
        clearFailedLoginCounter(tenantSlug, email, ipAddress);
        logActivity(tenantId, user.id(), "AUTH_PASSWORD_RESET_SUCCESS", "users", user.id(), ipAddress);
    }

    public String socialLoginUrl(String provider) {
        String normalizedProvider = normalizeSlug(provider);
        String state = createOauthState(normalizedProvider);
        if ("google".equals(normalizedProvider)) {
            if (!hasText(googleClientId) || !hasText(googleClientSecret)) {
                throw new ResponseStatusException(HttpStatus.SERVICE_UNAVAILABLE, "Google OAuth is not configured");
            }
            return "https://accounts.google.com/o/oauth2/v2/auth"
                    + "?client_id=" + encode(googleClientId)
                    + "&redirect_uri=" + encode(oauthRedirectUri("google"))
                    + "&response_type=code"
                    + "&scope=openid%20email%20profile"
                    + "&access_type=offline"
                    + "&prompt=select_account"
                    + "&state=" + encode(state);
        }

        throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Unsupported OAuth provider");
    }

    @Transactional
    public AuthTokens socialLoginCallback(String provider, String code, String state, String ipAddress) {
        String normalizedProvider = normalizeSlug(provider);
        validateOauthState(normalizedProvider, state);

        SocialProfile profile = switch (normalizedProvider) {
            case "google" -> fetchGoogleProfile(code);
            default -> throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Unsupported OAuth provider");
        };

        if (!profile.emailVerified()) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "OAuth email is not verified");
        }

        String tenantSlug = "elevora-ai";
        String email = normalizeEmail(profile.email());
        Long tenantId = findTenantIdBySlug(tenantSlug)
                .orElseGet(() -> createTenant("Elevora AI", tenantSlug));

        UserAuthRecord user = findUserForLogin(tenantId, email)
                .orElseGet(() -> createSocialUser(tenantId, email, profile.name()));

        jdbcTemplate.update(
                "UPDATE users SET is_verified = true, otp_code = NULL, otp_expiry = NULL, updated_at = CURRENT_TIMESTAMP "
                        + "WHERE id = ? AND tenant_id = ? AND email = ?",
                user.id(),
                tenantId,
                email);
        logActivity(tenantId, user.id(), "AUTH_OAUTH_" + normalizedProvider.toUpperCase(Locale.ROOT), "users", user.id(), ipAddress);
        return createTokens(user.id(), tenantId, email, user.role(), true);
    }

    public String frontendDashboardUrl() {
        return frontendBaseUrl.replaceAll("/+$", "") + "/dashboard";
    }

    @Transactional
    public void verifyOtp(VerifyOtpRequest request, String ipAddress) {
        String tenantSlug = normalizeSlug(request.tenantSlug());
        String email = normalizeEmail(request.email());
        Long tenantId = findTenantIdBySlug(tenantSlug)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Invalid OTP"));

        OtpRecord user = findOtpRecord(tenantId, email)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Invalid OTP"));

        if (user.verified()) {
            return;
        }

        if (user.otpHash() == null || user.otpExpiry() == null || user.otpExpiry().isBefore(Instant.now())) {
            logActivity(tenantId, user.id(), "AUTH_OTP_EXPIRED", "users", user.id(), ipAddress);
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "OTP expired");
        }

        if (!passwordEncoder.matches(request.otp(), user.otpHash())) {
            logActivity(tenantId, user.id(), "AUTH_OTP_FAILED", "users", user.id(), ipAddress);
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Invalid OTP");
        }

        jdbcTemplate.update(
                "UPDATE users SET is_verified = true, otp_code = NULL, otp_expiry = NULL, updated_at = CURRENT_TIMESTAMP "
                        + "WHERE id = ? AND tenant_id = ? AND email = ?",
                user.id(),
                tenantId,
                email);
        logActivity(tenantId, user.id(), "AUTH_OTP_VERIFIED", "users", user.id(), ipAddress);
    }

    private Optional<Long> findTenantIdBySlug(String tenantSlug) {
        try {
            Long tenantId = jdbcTemplate.queryForObject(
                    "SELECT id FROM tenants WHERE slug = ? AND tenant_id = id AND status = ?",
                    Long.class,
                    tenantSlug,
                    TENANT_STATUS_ACTIVE);
            return Optional.ofNullable(tenantId);
        } catch (EmptyResultDataAccessException ex) {
            return Optional.empty();
        }
    }

    private Long createTenant(String tenantName, String tenantSlug) {
        long temporaryTenantId = -Math.abs(SECURE_RANDOM.nextLong(1, Long.MAX_VALUE));
        KeyHolder keyHolder = new GeneratedKeyHolder();

        jdbcTemplate.update(connection -> {
            PreparedStatement ps = connection.prepareStatement(
                    "INSERT INTO tenants (tenant_id, name, slug, plan, status) VALUES (?, ?, ?, 'FREE', ?)",
                    Statement.RETURN_GENERATED_KEYS);
            ps.setLong(1, temporaryTenantId);
            ps.setString(2, tenantName);
            ps.setString(3, tenantSlug);
            ps.setString(4, TENANT_STATUS_ACTIVE);
            return ps;
        }, keyHolder);

        Long tenantId = requireGeneratedId(keyHolder, "tenant");
        jdbcTemplate.update(
                "UPDATE tenants SET tenant_id = ? WHERE id = ? AND tenant_id = ?",
                tenantId,
                tenantId,
                temporaryTenantId);
        return tenantId;
    }

    private boolean userExists(Long tenantId, String email) {
        Integer count = jdbcTemplate.queryForObject(
                "SELECT COUNT(1) FROM users WHERE tenant_id = ? AND email = ?",
                Integer.class,
                tenantId,
                email);
        return count != null && count > 0;
    }

    private Optional<UserAuthRecord> findUserForLogin(Long tenantId, String email) {
        try {
            UserAuthRecord user = jdbcTemplate.queryForObject(
                    "SELECT id, tenant_id, email, password_hash, role, is_verified "
                            + "FROM users WHERE tenant_id = ? AND email = ?",
                    (rs, rowNum) -> new UserAuthRecord(
                            rs.getLong("id"),
                            rs.getLong("tenant_id"),
                            rs.getString("email"),
                            rs.getString("password_hash"),
                            rs.getString("role"),
                            rs.getBoolean("is_verified")),
                    tenantId,
                    email);
            return Optional.ofNullable(user);
        } catch (EmptyResultDataAccessException ex) {
            return Optional.empty();
        }
    }

    private Optional<UserAuthRecord> findUserByIdAndTenant(Long userId, Long tenantId) {
        try {
            UserAuthRecord user = jdbcTemplate.queryForObject(
                    "SELECT id, tenant_id, email, password_hash, role, is_verified "
                            + "FROM users WHERE tenant_id = ? AND id = ?",
                    (rs, rowNum) -> new UserAuthRecord(
                            rs.getLong("id"),
                            rs.getLong("tenant_id"),
                            rs.getString("email"),
                            rs.getString("password_hash"),
                            rs.getString("role"),
                            rs.getBoolean("is_verified")),
                    tenantId,
                    userId);
            return Optional.ofNullable(user);
        } catch (EmptyResultDataAccessException ex) {
            return Optional.empty();
        }
    }

    private UserAuthRecord createSocialUser(Long tenantId, String email, String name) {
        String passwordHash = passwordEncoder.encode("SOCIAL-" + UUID.randomUUID() + "-" + SECURE_RANDOM.nextLong());
        KeyHolder keyHolder = new GeneratedKeyHolder();
        jdbcTemplate.update(connection -> {
            PreparedStatement ps = connection.prepareStatement(
                    "INSERT INTO users (tenant_id, email, password_hash, role, otp_code, otp_expiry, is_verified) "
                            + "VALUES (?, ?, ?, ?, NULL, NULL, true)",
                    Statement.RETURN_GENERATED_KEYS);
            ps.setLong(1, tenantId);
            ps.setString(2, email);
            ps.setString(3, passwordHash);
            ps.setString(4, USER_ROLE);
            return ps;
        }, keyHolder);

        Long userId = requireGeneratedId(keyHolder, "social user");
        return new UserAuthRecord(userId, tenantId, email, passwordHash, USER_ROLE, true);
    }

    private Optional<OtpRecord> findOtpRecord(Long tenantId, String email) {
        try {
            OtpRecord user = jdbcTemplate.queryForObject(
                    "SELECT id, tenant_id, email, otp_code, otp_expiry, is_verified "
                            + "FROM users WHERE tenant_id = ? AND email = ?",
                    (rs, rowNum) -> new OtpRecord(
                            rs.getLong("id"),
                            rs.getLong("tenant_id"),
                            rs.getString("email"),
                            rs.getString("otp_code"),
                            rs.getTimestamp("otp_expiry") == null ? null : rs.getTimestamp("otp_expiry").toInstant(),
                            rs.getBoolean("is_verified")),
                    tenantId,
                    email);
            return Optional.ofNullable(user);
        } catch (EmptyResultDataAccessException ex) {
            return Optional.empty();
        }
    }

    private AuthTokens createTokens(Long userId, Long tenantId, String email, String role, boolean verified) {
        Instant now = Instant.now();
        String accessToken = jwtUtil.generateAccessToken(userId, tenantId, email, role);
        String refreshToken = jwtUtil.generateRefreshToken(userId, tenantId, email, role);

        return new AuthTokens(
                userId,
                tenantId,
                email,
                role,
                verified,
                accessToken,
                refreshToken,
                now.plusSeconds(jwtUtil.getAccessTokenExpirySeconds()),
                now.plusSeconds(jwtUtil.getRefreshTokenExpirySeconds()));
    }

    private void sendOtpEmail(String email, String otp, String subject) {
        SimpleMailMessage message = new SimpleMailMessage();
        message.setFrom(mailFrom);
        message.setTo(email);
        message.setSubject(subject);
        message.setText("Your Elevora AI OTP is " + otp + ". It expires in "
                + Duration.ofSeconds(otpExpirySeconds).toMinutes() + " minutes.");
        try {
            mailSender.send(message);
        } catch (MailException ex) {
            throw new ResponseStatusException(HttpStatus.SERVICE_UNAVAILABLE, "OTP email service is not available", ex);
        }
    }

    private void logActivity(Long tenantId, Long userId, String action, String entityType, Long entityId, String ipAddress) {
        jdbcTemplate.update(
                "INSERT INTO activity_logs (tenant_id, user_id, action, entity_type, entity_id, ip_address) "
                        + "VALUES (?, ?, ?, ?, ?, ?)",
                tenantId,
                userId,
                action,
                entityType,
                entityId,
                sanitizeIp(ipAddress));
    }

    private void enforceLoginNotLocked(String tenantSlug, String email, String ipAddress) {
        String lockKey = failedLoginLockKey(tenantSlug, email, ipAddress);
        if (Boolean.TRUE.equals(redisTemplate.hasKey(lockKey))) {
            throw new ResponseStatusException(HttpStatus.TOO_MANY_REQUESTS, "Too many failed login attempts");
        }
    }

    private void registerFailedLogin(String tenantSlug, String email, String ipAddress) {
        String counterKey = failedLoginCounterKey(tenantSlug, email, ipAddress);
        Long attempts = redisTemplate.opsForValue().increment(counterKey);
        redisTemplate.expire(counterKey, Duration.ofMinutes(failedLoginLockMinutes));

        if (attempts != null && attempts >= failedLoginMaxAttempts) {
            redisTemplate.opsForValue().set(
                    failedLoginLockKey(tenantSlug, email, ipAddress),
                    "locked",
                    Duration.ofMinutes(failedLoginLockMinutes));
        }
    }

    private void clearFailedLoginCounter(String tenantSlug, String email, String ipAddress) {
        redisTemplate.delete(failedLoginCounterKey(tenantSlug, email, ipAddress));
        redisTemplate.delete(failedLoginLockKey(tenantSlug, email, ipAddress));
    }

    private String createOauthState(String provider) {
        String state = UUID.randomUUID().toString().replace("-", "") + UUID.randomUUID().toString().replace("-", "");
        redisTemplate.opsForValue().set("auth:oauth-state:" + state, provider, Duration.ofMinutes(10));
        return state;
    }

    private void validateOauthState(String provider, String state) {
        if (!hasText(state)) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "OAuth state is required");
        }

        String key = "auth:oauth-state:" + state;
        String expectedProvider = redisTemplate.opsForValue().get(key);
        redisTemplate.delete(key);
        if (!provider.equals(expectedProvider)) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Invalid OAuth state");
        }
    }

    private SocialProfile fetchGoogleProfile(String code) {
        JsonNode token = exchangeToken(
                "https://oauth2.googleapis.com/token",
                googleClientId,
                googleClientSecret,
                oauthRedirectUri("google"),
                code);
        String idToken = requireJsonText(token, "id_token", "Google id token is missing");
        JsonNode profile = restClient.get()
                .uri("https://oauth2.googleapis.com/tokeninfo?id_token={idToken}", idToken)
                .retrieve()
                .body(JsonNode.class);

        if (profile == null) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Google profile is unavailable");
        }

        String email = requireJsonText(profile, "email", "Google email is missing");
        boolean verified = profile.path("email_verified").asBoolean(false);
        String name = profile.path("name").asText(email);
        return new SocialProfile(email, name, verified);
    }

    private JsonNode exchangeToken(String tokenUrl, String clientId, String clientSecret, String redirectUri, String code) {
        if (!hasText(code)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "OAuth code is required");
        }

        MultiValueMap<String, String> form = new LinkedMultiValueMap<>();
        form.add("client_id", clientId);
        form.add("client_secret", clientSecret);
        form.add("redirect_uri", redirectUri);
        form.add("code", code);
        form.add("grant_type", "authorization_code");

        try {
            JsonNode body = restClient.post()
                    .uri(tokenUrl)
                    .contentType(MediaType.APPLICATION_FORM_URLENCODED)
                    .body(form)
                    .retrieve()
                    .body(JsonNode.class);
            if (body == null) {
                throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "OAuth token response is empty");
            }
            return body;
        } catch (RuntimeException ex) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "OAuth token exchange failed", ex);
        }
    }

    private String requireJsonText(JsonNode node, String fieldName, String message) {
        String value = node.path(fieldName).asText("");
        if (!hasText(value)) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, message);
        }
        return value;
    }

    private String oauthRedirectUri(String provider) {
        return appBaseUrl.replaceAll("/+$", "") + "/api/auth/oauth/" + provider + "/callback";
    }

    private String encode(String value) {
        return URLEncoder.encode(value, StandardCharsets.UTF_8);
    }

    private String failedLoginCounterKey(String tenantSlug, String email, String ipAddress) {
        return "auth:failed-login:" + tenantSlug + ":" + email + ":" + sanitizeIp(ipAddress);
    }

    private String failedLoginLockKey(String tenantSlug, String email, String ipAddress) {
        return "auth:failed-login-lock:" + tenantSlug + ":" + email + ":" + sanitizeIp(ipAddress);
    }

    private String generateOtp() {
        return String.format(Locale.ROOT, "%06d", SECURE_RANDOM.nextInt(1_000_000));
    }

    private String normalizeEmail(String email) {
        return email.trim().toLowerCase(Locale.ROOT);
    }

    private String normalizeSlug(String slug) {
        return slug.trim().toLowerCase(Locale.ROOT);
    }

    private String sanitizeIp(String ipAddress) {
        if (ipAddress == null || ipAddress.isBlank()) {
            return "0.0.0.0";
        }
        return ipAddress.length() <= 45 ? ipAddress : ipAddress.substring(0, 45);
    }

    private boolean hasText(String value) {
        return value != null && !value.isBlank();
    }

    private ResponseStatusException unauthorized() {
        return new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Invalid credentials");
    }

    private Long requireGeneratedId(KeyHolder keyHolder, String entityName) {
        Number key = keyHolder.getKey();
        if (key == null) {
            throw new IllegalStateException("Failed to create " + entityName);
        }
        return key.longValue();
    }

    private record UserAuthRecord(
            Long id,
            Long tenantId,
            String email,
            String passwordHash,
            String role,
            boolean verified) {
    }

    private record OtpRecord(
            Long id,
            Long tenantId,
            String email,
            String otpHash,
            Instant otpExpiry,
            boolean verified) {
    }

    private record SocialProfile(String email, String name, boolean emailVerified) {
    }
}
