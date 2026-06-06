package com.elevoraai.controller;

import com.elevoraai.config.JwtUtil;
import com.elevoraai.service.AuthService;
import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import java.io.IOException;
import java.time.Instant;
import java.util.Arrays;
import java.util.Optional;
import org.springframework.http.MediaType;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseCookie;
import org.springframework.http.ResponseEntity;
import org.springframework.util.StringUtils;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final AuthService authService;
    private final JwtUtil jwtUtil;

    public AuthController(AuthService authService, JwtUtil jwtUtil) {
        this.authService = authService;
        this.jwtUtil = jwtUtil;
    }

    @PostMapping("/register")
    public ResponseEntity<AuthResponse> register(
            @Valid @RequestBody RegisterRequest request,
            HttpServletRequest httpRequest,
            HttpServletResponse response) {
        AuthTokens tokens = authService.register(request, clientIp(httpRequest));
        addAuthCookies(response, tokens);
        return ResponseEntity.status(HttpStatus.CREATED).body(AuthResponse.from(tokens));
    }

    @PostMapping("/login")
    public ResponseEntity<AuthResponse> login(
            @Valid @RequestBody LoginRequest request,
            HttpServletRequest httpRequest,
            HttpServletResponse response) {
        AuthTokens tokens = authService.login(request, clientIp(httpRequest));
        addAuthCookies(response, tokens);
        return ResponseEntity.ok(AuthResponse.from(tokens));
    }

    @PostMapping("/refresh")
    public ResponseEntity<AuthResponse> refresh(
            HttpServletRequest request,
            HttpServletResponse response) {
        String refreshToken = extractCookie(request, jwtUtil.getRefreshCookieName())
                .orElseThrow(() -> new IllegalArgumentException("Refresh token cookie is required"));
        AuthTokens tokens = authService.refresh(refreshToken, clientIp(request));
        addAuthCookies(response, tokens);
        return ResponseEntity.ok(AuthResponse.from(tokens));
    }

    @PostMapping("/forgot-password")
    public ResponseEntity<MessageResponse> forgotPassword(
            @Valid @RequestBody ForgotPasswordRequest request,
            HttpServletRequest httpRequest) {
        authService.forgotPassword(request, clientIp(httpRequest));
        return ResponseEntity.accepted().body(new MessageResponse("Password reset OTP sent if the account exists"));
    }

    @PostMapping("/reset-password")
    public ResponseEntity<MessageResponse> resetPassword(
            @Valid @RequestBody ResetPasswordRequest request,
            HttpServletRequest httpRequest) {
        authService.resetPassword(request, clientIp(httpRequest));
        return ResponseEntity.ok(new MessageResponse("Password reset successful"));
    }

    @PostMapping("/verify-otp")
    public ResponseEntity<MessageResponse> verifyOtp(
            @Valid @RequestBody VerifyOtpRequest request,
            HttpServletRequest httpRequest) {
        authService.verifyOtp(request, clientIp(httpRequest));
        return ResponseEntity.ok(new MessageResponse("Email verified"));
    }

    @GetMapping(value = "/oauth/{provider}/start", produces = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<SocialLoginStartResponse> startSocialLogin(@PathVariable String provider) {
        return ResponseEntity.ok(new SocialLoginStartResponse(authService.socialLoginUrl(provider)));
    }

    @GetMapping("/oauth/{provider}/callback")
    public void socialLoginCallbackGet(
            @PathVariable String provider,
            @RequestParam String code,
            @RequestParam String state,
            HttpServletRequest request,
            HttpServletResponse response) throws IOException {
        completeSocialLogin(provider, code, state, request, response);
    }

    @PostMapping("/oauth/{provider}/callback")
    public void socialLoginCallbackPost(
            @PathVariable String provider,
            @RequestParam String code,
            @RequestParam String state,
            HttpServletRequest request,
            HttpServletResponse response) throws IOException {
        completeSocialLogin(provider, code, state, request, response);
    }

    @PostMapping("/logout")
    public ResponseEntity<MessageResponse> logout(HttpServletResponse response) {
        ResponseCookie accessCookie = jwtUtil.clearAccessTokenCookie();
        ResponseCookie refreshCookie = jwtUtil.clearRefreshTokenCookie();
        response.addHeader(HttpHeaders.SET_COOKIE, accessCookie.toString());
        response.addHeader(HttpHeaders.SET_COOKIE, refreshCookie.toString());
        return ResponseEntity.ok(new MessageResponse("Logged out"));
    }

    private void addAuthCookies(HttpServletResponse response, AuthTokens tokens) {
        ResponseCookie accessCookie = jwtUtil.createAccessTokenCookie(tokens.accessToken());
        ResponseCookie refreshCookie = jwtUtil.createRefreshTokenCookie(tokens.refreshToken());
        response.addHeader(HttpHeaders.SET_COOKIE, accessCookie.toString());
        response.addHeader(HttpHeaders.SET_COOKIE, refreshCookie.toString());
    }

    private void completeSocialLogin(
            String provider,
            String code,
            String state,
            HttpServletRequest request,
            HttpServletResponse response) throws IOException {
        AuthTokens tokens = authService.socialLoginCallback(provider, code, state, clientIp(request));
        addAuthCookies(response, tokens);
        response.sendRedirect(authService.frontendDashboardUrl());
    }

    private Optional<String> extractCookie(HttpServletRequest request, String cookieName) {
        Cookie[] cookies = request.getCookies();
        if (cookies == null || !StringUtils.hasText(cookieName)) {
            return Optional.empty();
        }

        return Arrays.stream(cookies)
                .filter(cookie -> cookieName.equals(cookie.getName()))
                .map(Cookie::getValue)
                .filter(StringUtils::hasText)
                .findFirst();
    }

    private String clientIp(HttpServletRequest request) {
        String forwardedFor = request.getHeader("X-Forwarded-For");
        if (StringUtils.hasText(forwardedFor)) {
            return forwardedFor.split(",")[0].trim();
        }
        return request.getRemoteAddr();
    }

    public record RegisterRequest(
            @NotBlank(message = "Tenant slug is required")
            @Size(min = 2, max = 120, message = "Tenant slug must be between 2 and 120 characters")
            @Pattern(regexp = "^[a-z0-9][a-z0-9-]*[a-z0-9]$", message = "Tenant slug must use lowercase letters, numbers, and hyphens")
            String tenantSlug,

            @NotBlank(message = "Name is required")
            @Size(min = 2, max = 255, message = "Name must be between 2 and 255 characters")
            String name,

            @NotBlank(message = "Email is required")
            @Email(message = "Email must be valid")
            @Size(max = 255, message = "Email must not exceed 255 characters")
            String email,

            @NotBlank(message = "Password is required")
            @Size(min = 12, max = 128, message = "Password must be between 12 and 128 characters")
            @Pattern(
                    regexp = "^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[^A-Za-z0-9]).+$",
                    message = "Password must include uppercase, lowercase, number, and special character")
            String password,

            @jakarta.validation.constraints.NotNull(message = "You must agree to the Privacy Policy and Terms to continue.")
            @jakarta.validation.constraints.AssertTrue(message = "You must agree to the Privacy Policy and Terms to continue.")
            Boolean agreedToTerms) {
    }

    public record LoginRequest(
            @NotBlank(message = "Tenant slug is required")
            @Size(min = 2, max = 120, message = "Tenant slug must be between 2 and 120 characters")
            @Pattern(regexp = "^[a-z0-9][a-z0-9-]*[a-z0-9]$", message = "Tenant slug must use lowercase letters, numbers, and hyphens")
            String tenantSlug,

            @NotBlank(message = "Email is required")
            @Email(message = "Email must be valid")
            @Size(max = 255, message = "Email must not exceed 255 characters")
            String email,

            @NotBlank(message = "Password is required")
            @Size(min = 12, max = 128, message = "Password must be between 12 and 128 characters")
            String password) {
    }

    public record ForgotPasswordRequest(
            @NotBlank(message = "Tenant slug is required")
            @Size(min = 2, max = 120, message = "Tenant slug must be between 2 and 120 characters")
            @Pattern(regexp = "^[a-z0-9][a-z0-9-]*[a-z0-9]$", message = "Tenant slug must use lowercase letters, numbers, and hyphens")
            String tenantSlug,

            @NotBlank(message = "Email is required")
            @Email(message = "Email must be valid")
            @Size(max = 255, message = "Email must not exceed 255 characters")
            String email) {
    }

    public record VerifyOtpRequest(
            @NotBlank(message = "Tenant slug is required")
            @Size(min = 2, max = 120, message = "Tenant slug must be between 2 and 120 characters")
            @Pattern(regexp = "^[a-z0-9][a-z0-9-]*[a-z0-9]$", message = "Tenant slug must use lowercase letters, numbers, and hyphens")
            String tenantSlug,

            @NotBlank(message = "Email is required")
            @Email(message = "Email must be valid")
            @Size(max = 255, message = "Email must not exceed 255 characters")
            String email,

            @NotBlank(message = "OTP is required")
            @Pattern(regexp = "^[0-9]{6}$", message = "OTP must be a 6-digit code")
            String otp) {
    }

    public record ResetPasswordRequest(
            @NotBlank(message = "Tenant slug is required")
            @Size(min = 2, max = 120, message = "Tenant slug must be between 2 and 120 characters")
            @Pattern(regexp = "^[a-z0-9][a-z0-9-]*[a-z0-9]$", message = "Tenant slug must use lowercase letters, numbers, and hyphens")
            String tenantSlug,

            @NotBlank(message = "Email is required")
            @Email(message = "Email must be valid")
            @Size(max = 255, message = "Email must not exceed 255 characters")
            String email,

            @NotBlank(message = "OTP is required")
            @Pattern(regexp = "^[0-9]{6}$", message = "OTP must be a 6-digit code")
            String otp,

            @NotBlank(message = "Password is required")
            @Size(min = 12, max = 128, message = "Password must be between 12 and 128 characters")
            @Pattern(
                    regexp = "^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[^A-Za-z0-9]).+$",
                    message = "Password must include uppercase, lowercase, number, and special character")
            String newPassword) {
    }

    public record AuthTokens(
            Long userId,
            Long tenantId,
            String email,
            String role,
            boolean verified,
            String accessToken,
            String refreshToken,
            Instant accessTokenExpiresAt,
            Instant refreshTokenExpiresAt) {
    }

    public record AuthResponse(
            Long userId,
            Long tenantId,
            String email,
            String role,
            boolean verified,
            Instant accessTokenExpiresAt,
            Instant refreshTokenExpiresAt) {

        static AuthResponse from(AuthTokens tokens) {
            return new AuthResponse(
                    tokens.userId(),
                    tokens.tenantId(),
                    tokens.email(),
                    tokens.role(),
                    tokens.verified(),
                    tokens.accessTokenExpiresAt(),
                    tokens.refreshTokenExpiresAt());
        }
    }

    public record MessageResponse(String message) {
    }

    public record SocialLoginStartResponse(String authUrl) {
    }
}
