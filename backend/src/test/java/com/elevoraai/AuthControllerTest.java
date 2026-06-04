package com.elevoraai;

import static org.hamcrest.Matchers.not;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.cookie;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.elevoraai.config.JwtUtil;
import com.elevoraai.controller.AuthController;
import com.elevoraai.controller.AuthController.AuthTokens;
import com.elevoraai.service.AuthService;
import jakarta.servlet.http.Cookie;
import java.time.Instant;
import org.junit.jupiter.api.Test;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseCookie;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.server.ResponseStatusException;

@WebMvcTest(AuthController.class)
@AutoConfigureMockMvc(addFilters = false)
class AuthControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private AuthService authService;

    @MockBean
    private JwtUtil jwtUtil;

    @Test
    void registerSuccessSetsHttpOnlyCookiesAndDoesNotReturnTokensOrPlainPassword() throws Exception {
        AuthTokens tokens = tokens();
        when(authService.register(any(), anyString())).thenReturn(tokens);
        when(jwtUtil.createAccessTokenCookie("access.jwt")).thenReturn(ResponseCookie.from("elevora_access_token", "access.jwt").httpOnly(true).path("/").build());
        when(jwtUtil.createRefreshTokenCookie("refresh.jwt")).thenReturn(ResponseCookie.from("elevora_refresh_token", "refresh.jwt").httpOnly(true).path("/").build());

        mockMvc.perform(post("/api/auth/register")
                        .contentType("application/json")
                        .content("""
                                {
                                  "tenantSlug": "elevora-ai",
                                  "name": "Elevora User",
                                  "email": "user@example.com",
                                  "password": "StrongPass@123"
                                }
                                """))
                .andExpect(status().isCreated())
                .andExpect(cookie().httpOnly("elevora_access_token", true))
                .andExpect(cookie().httpOnly("elevora_refresh_token", true))
                .andExpect(jsonPath("$.email").value("user@example.com"))
                .andExpect(content().string(not(org.hamcrest.Matchers.containsString("StrongPass@123"))))
                .andExpect(content().string(not(org.hamcrest.Matchers.containsString("access.jwt"))))
                .andExpect(content().string(not(org.hamcrest.Matchers.containsString("refresh.jwt"))));
    }

    @Test
    void registerRejectsInvalidInput() throws Exception {
        mockMvc.perform(post("/api/auth/register")
                        .contentType("application/json")
                        .content("""
                                {
                                  "tenantSlug": "bad slug",
                                  "name": "A",
                                  "email": "not-an-email",
                                  "password": "weak"
                                }
                                """))
                .andExpect(status().isBadRequest());

        verifyNoInteractions(authService);
    }

    @Test
    void registerDuplicateEmailReturnsConflict() throws Exception {
        when(authService.register(any(), anyString())).thenThrow(new ResponseStatusException(HttpStatus.CONFLICT, "duplicate"));

        mockMvc.perform(post("/api/auth/register")
                        .contentType("application/json")
                        .content(validRegisterJson()))
                .andExpect(status().isConflict());
    }

    @Test
    void loginSuccessSetsHttpOnlyCookies() throws Exception {
        AuthTokens tokens = tokens();
        when(authService.login(any(), anyString())).thenReturn(tokens);
        when(jwtUtil.createAccessTokenCookie("access.jwt")).thenReturn(ResponseCookie.from("elevora_access_token", "access.jwt").httpOnly(true).path("/").build());
        when(jwtUtil.createRefreshTokenCookie("refresh.jwt")).thenReturn(ResponseCookie.from("elevora_refresh_token", "refresh.jwt").httpOnly(true).path("/").build());

        mockMvc.perform(post("/api/auth/login")
                        .contentType("application/json")
                        .content("""
                                {
                                  "tenantSlug": "elevora-ai",
                                  "email": "user@example.com",
                                  "password": "StrongPass@123"
                                }
                                """))
                .andExpect(status().isOk())
                .andExpect(cookie().httpOnly("elevora_access_token", true))
                .andExpect(cookie().httpOnly("elevora_refresh_token", true))
                .andExpect(content().string(not(org.hamcrest.Matchers.containsString("StrongPass@123"))))
                .andExpect(content().string(not(org.hamcrest.Matchers.containsString("access.jwt"))));
    }

    @Test
    void loginWrongPasswordReturnsUnauthorized() throws Exception {
        when(authService.login(any(), anyString())).thenThrow(new ResponseStatusException(HttpStatus.UNAUTHORIZED, "bad credentials"));

        mockMvc.perform(post("/api/auth/login")
                        .contentType("application/json")
                        .content("""
                                {
                                  "tenantSlug": "elevora-ai",
                                  "email": "user@example.com",
                                  "password": "WrongPass@123"
                                }
                                """))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void loginRateLimitHitReturnsTooManyRequests() throws Exception {
        when(authService.login(any(), anyString())).thenThrow(new ResponseStatusException(HttpStatus.TOO_MANY_REQUESTS, "locked"));

        mockMvc.perform(post("/api/auth/login")
                        .contentType("application/json")
                        .content("""
                                {
                                  "tenantSlug": "elevora-ai",
                                  "email": "user@example.com",
                                  "password": "StrongPass@123"
                                }
                                """))
                .andExpect(status().isTooManyRequests());
    }

    @Test
    void refreshSuccessUsesRefreshCookieAndReturnsNewHttpOnlyCookies() throws Exception {
        AuthTokens tokens = tokens();
        when(jwtUtil.getRefreshCookieName()).thenReturn("elevora_refresh_token");
        when(authService.refresh("refresh.jwt", "127.0.0.1")).thenReturn(tokens);
        when(jwtUtil.createAccessTokenCookie("access.jwt")).thenReturn(ResponseCookie.from("elevora_access_token", "access.jwt").httpOnly(true).path("/").build());
        when(jwtUtil.createRefreshTokenCookie("refresh.jwt")).thenReturn(ResponseCookie.from("elevora_refresh_token", "refresh.jwt").httpOnly(true).path("/").build());

        mockMvc.perform(post("/api/auth/refresh")
                        .cookie(new Cookie("elevora_refresh_token", "refresh.jwt")))
                .andExpect(status().isOk())
                .andExpect(cookie().httpOnly("elevora_access_token", true))
                .andExpect(cookie().httpOnly("elevora_refresh_token", true))
                .andExpect(content().string(not(org.hamcrest.Matchers.containsString("access.jwt"))));

        verify(authService).refresh("refresh.jwt", "127.0.0.1");
    }

    @Test
    void refreshExpiredTokenReturnsUnauthorized() throws Exception {
        when(jwtUtil.getRefreshCookieName()).thenReturn("elevora_refresh_token");
        when(authService.refresh("expired.jwt", "127.0.0.1")).thenThrow(new ResponseStatusException(HttpStatus.UNAUTHORIZED, "expired"));

        mockMvc.perform(post("/api/auth/refresh")
                        .cookie(new Cookie("elevora_refresh_token", "expired.jwt")))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void forgotPasswordSuccessReturnsAccepted() throws Exception {
        mockMvc.perform(post("/api/auth/forgot-password")
                        .contentType("application/json")
                        .content("""
                                {
                                  "tenantSlug": "elevora-ai",
                                  "email": "user@example.com"
                                }
                                """))
                .andExpect(status().isAccepted())
                .andExpect(jsonPath("$.message").value("Password reset OTP sent if the account exists"));

        verify(authService).forgotPassword(any(), anyString());
    }

    @Test
    void verifyOtpSuccessReturnsOk() throws Exception {
        mockMvc.perform(post("/api/auth/verify-otp")
                        .contentType("application/json")
                        .content("""
                                {
                                  "tenantSlug": "elevora-ai",
                                  "email": "user@example.com",
                                  "otp": "123456"
                                }
                                """))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.message").value("Email verified"));

        verify(authService).verifyOtp(any(), anyString());
    }

    @Test
    void verifyOtpRejectsInvalidInput() throws Exception {
        mockMvc.perform(post("/api/auth/verify-otp")
                        .contentType("application/json")
                        .content("""
                                {
                                  "tenantSlug": "elevora-ai",
                                  "email": "user@example.com",
                                  "otp": "12345"
                                }
                                """))
                .andExpect(status().isBadRequest());
    }

    @Test
    void resetPasswordSuccessReturnsOk() throws Exception {
        mockMvc.perform(post("/api/auth/reset-password")
                        .contentType("application/json")
                        .content("""
                                {
                                  "tenantSlug": "elevora-ai",
                                  "email": "user@example.com",
                                  "otp": "123456",
                                  "newPassword": "NewStrongPass@123"
                                }
                                """))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.message").value("Password reset successful"))
                .andExpect(content().string(not(org.hamcrest.Matchers.containsString("NewStrongPass@123"))));

        verify(authService).resetPassword(any(), anyString());
    }

    @Test
    void resetPasswordRejectsWeakPassword() throws Exception {
        mockMvc.perform(post("/api/auth/reset-password")
                        .contentType("application/json")
                        .content("""
                                {
                                  "tenantSlug": "elevora-ai",
                                  "email": "user@example.com",
                                  "otp": "123456",
                                  "newPassword": "weak"
                                }
                                """))
                .andExpect(status().isBadRequest());
    }

    @Test
    void socialLoginStartReturnsAuthUrl() throws Exception {
        when(authService.socialLoginUrl("google")).thenReturn("https://accounts.google.com/o/oauth2/v2/auth");

        mockMvc.perform(get("/api/auth/oauth/google/start"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.authUrl").value("https://accounts.google.com/o/oauth2/v2/auth"));
    }

    private AuthTokens tokens() {
        return new AuthTokens(
                7L,
                3L,
                "user@example.com",
                "USER",
                true,
                "access.jwt",
                "refresh.jwt",
                Instant.now().plusSeconds(900),
                Instant.now().plusSeconds(604800));
    }

    private String validRegisterJson() {
        return """
                {
                  "tenantSlug": "elevora-ai",
                  "name": "Elevora User",
                  "email": "user@example.com",
                  "password": "StrongPass@123"
                }
                """;
    }
}
