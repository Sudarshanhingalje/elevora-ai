package com.elevoraai.controller;

import com.elevoraai.config.SecurityConfig.JwtPrincipal;
import com.elevoraai.service.UserLocationService;
import com.elevoraai.service.UserLocationService.CityLocationMarker;
import com.elevoraai.service.UserLocationService.LocationStats;
import java.time.Duration;
import java.util.List;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

@RestController
@RequestMapping("/api/admin/user-locations")
@PreAuthorize("hasRole('ADMIN')")
public class UserLocationController {

    private final UserLocationService userLocationService;
    private final StringRedisTemplate redisTemplate;

    public UserLocationController(UserLocationService userLocationService, StringRedisTemplate redisTemplate) {
        this.userLocationService = userLocationService;
        this.redisTemplate = redisTemplate;
    }

    @GetMapping
    public List<CityLocationMarker> getCityMarkers(@AuthenticationPrincipal JwtPrincipal principal) {
        enforceRateLimit(principal, "markers", 60, 60);
        return userLocationService.getCityMarkers(principal.tenantId());
    }

    @GetMapping("/stats")
    public LocationStats getLocationStats(@AuthenticationPrincipal JwtPrincipal principal) {
        enforceRateLimit(principal, "stats", 60, 60);
        return userLocationService.getLocationStats(principal.tenantId());
    }

    private void enforceRateLimit(JwtPrincipal principal, String endpoint, int limit, int durationSeconds) {
        String key = "ratelimit:user-locations:" + endpoint + ":" + principal.tenantId() + ":" + principal.userId();
        try {
            Long count = redisTemplate.opsForValue().increment(key);
            if (count != null) {
                if (count == 1) {
                    redisTemplate.expire(key, Duration.ofSeconds(durationSeconds));
                }
                if (count > limit) {
                    throw new ResponseStatusException(HttpStatus.TOO_MANY_REQUESTS, "Too many requests. Please try again later.");
                }
            }
        } catch (ResponseStatusException e) {
            throw e;
        } catch (Exception e) {
            // Log error but allow request to pass if Redis is down (fail-open for resilience)
            // Note: log is static, but let's just let it fall through or we can log it.
        }
    }
}
