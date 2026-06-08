package com.elevoraai.config;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.time.Duration;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;
import org.springframework.web.filter.OncePerRequestFilter;

@Component
public class RateLimitingFilter extends OncePerRequestFilter {

    private static final Logger log = LoggerFactory.getLogger(RateLimitingFilter.class);
    private final StringRedisTemplate redisTemplate;
    private static final int DEFAULT_LIMIT = 100;
    private static final int WINDOW_SECONDS = 60;

    public RateLimitingFilter(StringRedisTemplate redisTemplate) {
        this.redisTemplate = redisTemplate;
    }

    @Override
    protected void doFilterInternal(
            HttpServletRequest request,
            HttpServletResponse response,
            FilterChain filterChain) throws ServletException, IOException {

        String path = request.getRequestURI();

        // Rate limit only API endpoints
        if (path.startsWith("/api/")) {
            String ip = clientIp(request);
            String key = "ratelimit:api:" + ip;

            try {
                Long count = redisTemplate.opsForValue().increment(key);
                if (count != null) {
                    if (count == 1) {
                        redisTemplate.expire(key, Duration.ofSeconds(WINDOW_SECONDS));
                    }
                    if (count > DEFAULT_LIMIT) {
                        log.warn("Rate limit exceeded for IP: {} on path: {}. Count: {}", ip, path, count);
                        response.setStatus(HttpStatus.TOO_MANY_REQUESTS.value());
                        response.setContentType("application/json");
                        response.getWriter().write("{\"error\": \"Too Many Requests\", \"message\": \"Rate limit exceeded. Please try again later.\"}");
                        return;
                    }
                }
            } catch (Exception e) {
                // Fail-open: if Redis is down, log error and allow requests to proceed
                log.error("Redis rate limiter error, allowing request to pass-through", e);
            }
        }

        filterChain.doFilter(request, response);
    }

    private String clientIp(HttpServletRequest request) {
        String forwardedFor = request.getHeader("X-Forwarded-For");
        if (StringUtils.hasText(forwardedFor)) {
            return forwardedFor.split(",")[0].trim();
        }
        return request.getRemoteAddr();
    }
}
