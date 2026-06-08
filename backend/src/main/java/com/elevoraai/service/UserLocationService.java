package com.elevoraai.service;

import java.sql.ResultSet;
import java.sql.SQLException;
import java.time.Instant;
import java.util.List;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class UserLocationService {

    private static final Logger log = LoggerFactory.getLogger(UserLocationService.class);
    private final JdbcTemplate jdbcTemplate;
    private final GeoIPService geoIPService;

    public UserLocationService(JdbcTemplate jdbcTemplate, GeoIPService geoIPService) {
        this.jdbcTemplate = jdbcTemplate;
        this.geoIPService = geoIPService;
    }

    @Transactional
    public void recordLocation(Long tenantId, Long userId, String ipAddress) {
        if (tenantId == null || userId == null) {
            return;
        }

        try {
            GeoIPService.LocationResult loc = geoIPService.lookup(ipAddress);
            
            jdbcTemplate.update(
                    "INSERT INTO user_locations (user_id, tenant_id, ip_address, country, state, city, latitude, longitude, is_localhost, last_login_at, created_at, updated_at) "
                            + "VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP) "
                            + "ON DUPLICATE KEY UPDATE "
                            + "ip_address = VALUES(ip_address), "
                            + "country = VALUES(country), "
                            + "state = VALUES(state), "
                            + "city = VALUES(city), "
                            + "latitude = VALUES(latitude), "
                            + "longitude = VALUES(longitude), "
                            + "is_localhost = VALUES(is_localhost), "
                            + "last_login_at = CURRENT_TIMESTAMP, "
                            + "updated_at = CURRENT_TIMESTAMP",
                    userId, tenantId, ipAddress, loc.country(), loc.state(), loc.city(), loc.latitude(), loc.longitude(), loc.isLocalhost()
            );
            log.info("Recorded location for user_id: {}, IP: {}, Location: {}/{}/{} (Localhost: {})", userId, ipAddress, loc.country(), loc.state(), loc.city(), loc.isLocalhost());
        } catch (Exception e) {
            log.error("Failed to record user location for user_id: {}", userId, e);
        }
    }

    @Transactional(readOnly = true)
    public LocationStats getLocationStats(Long tenantId) {
        Long totalUsers = jdbcTemplate.queryForObject(
                "SELECT COUNT(1) FROM users WHERE tenant_id = ?",
                Long.class, tenantId);

        Long activeToday = jdbcTemplate.queryForObject(
                "SELECT COUNT(1) FROM user_locations WHERE tenant_id = ? AND last_login_at >= DATE_SUB(NOW(), INTERVAL 1 DAY)",
                Long.class, tenantId);

        Long statesReached = jdbcTemplate.queryForObject(
                "SELECT COUNT(DISTINCT state) FROM user_locations WHERE tenant_id = ? AND state <> 'Unknown' AND state <> 'Local Network'",
                Long.class, tenantId);

        Long citiesReached = jdbcTemplate.queryForObject(
                "SELECT COUNT(DISTINCT city) FROM user_locations WHERE tenant_id = ? AND city <> 'Unknown' AND city <> 'Local Loopback'",
                Long.class, tenantId);

        return new LocationStats(
                totalUsers != null ? totalUsers : 0L,
                activeToday != null ? activeToday : 0L,
                statesReached != null ? statesReached : 0L,
                citiesReached != null ? citiesReached : 0L
        );
    }

    @Transactional(readOnly = true)
    public List<CityLocationMarker> getCityMarkers(Long tenantId) {
        return jdbcTemplate.query(
                "SELECT city, state, country, latitude, longitude, is_localhost, COUNT(1) AS user_count, MAX(last_login_at) AS last_active_at "
                        + "FROM user_locations "
                        + "WHERE tenant_id = ? AND city <> 'Unknown' "
                        + "GROUP BY city, state, country, latitude, longitude, is_localhost",
                this::mapCityMarker,
                tenantId
        );
    }

    private CityLocationMarker mapCityMarker(ResultSet rs, int rowNum) throws SQLException {
        return new CityLocationMarker(
                rs.getString("city"),
                rs.getString("state"),
                rs.getString("country"),
                rs.getDouble("latitude"),
                rs.getDouble("longitude"),
                rs.getLong("user_count"),
                rs.getTimestamp("last_active_at").toInstant(),
                rs.getBoolean("is_localhost")
        );
    }

    public record LocationStats(
            long totalUsers,
            long activeToday,
            long statesReached,
            long citiesReached
    ) {}

    public record CityLocationMarker(
            String city,
            String state,
            String country,
            double latitude,
            double longitude,
            long userCount,
            Instant lastActiveAt,
            boolean isLocalhost
    ) {}
}

