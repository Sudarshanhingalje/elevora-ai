package com.elevoraai.service;

import com.maxmind.geoip2.DatabaseReader;
import com.maxmind.geoip2.exception.GeoIp2Exception;
import com.maxmind.geoip2.model.CityResponse;
import jakarta.annotation.PostConstruct;
import jakarta.annotation.PreDestroy;
import java.io.File;
import java.io.IOException;
import java.net.InetAddress;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

@Service
public class GeoIPService {

    private static final Logger log = LoggerFactory.getLogger(GeoIPService.class);
    private DatabaseReader dbReader;

    @Value("${app.geolocation.localhost.fallback.city:Pune}")
    private String fallbackCity;

    @Value("${app.geolocation.localhost.fallback.state:Maharashtra}")
    private String fallbackState;

    @Value("${app.geolocation.localhost.fallback.country:India}")
    private String fallbackCountry;

    @Value("${app.geolocation.localhost.fallback.latitude:18.5204}")
    private double fallbackLatitude;

    @Value("${app.geolocation.localhost.fallback.longitude:73.8567}")
    private double fallbackLongitude;

    public record LocationResult(
            String country,
            String state,
            String city,
            double latitude,
            double longitude,
            boolean isLocalhost
    ) {}

    @PostConstruct
    public void init() {
        try {
            // Try loading from standard resource or root path
            File database = new File("src/main/resources/GeoLite2-City.mmdb");
            if (!database.exists()) {
                database = new File("backend/src/main/resources/GeoLite2-City.mmdb");
            }
            if (!database.exists()) {
                database = new File("GeoLite2-City.mmdb");
            }

            if (database.exists()) {
                this.dbReader = new DatabaseReader.Builder(database).build();
                log.info("Successfully loaded GeoLite2-City database from: {}", database.getAbsolutePath());
            } else {
                log.warn("GeoLite2-City.mmdb database file NOT found. IP Geolocation will default to 'Unknown'.");
            }
        } catch (IOException e) {
            log.error("Failed to initialize GeoLite2 database reader", e);
        }
    }

    @PreDestroy
    public void destroy() {
        if (dbReader != null) {
            try {
                dbReader.close();
            } catch (IOException e) {
                log.error("Error closing GeoLite2 database reader", e);
            }
        }
    }

    public LocationResult lookup(String ipAddress) {
        if (ipAddress == null || ipAddress.isBlank()) {
            return unknown();
        }

        String cleanIp = ipAddress.trim();
        // Handle local loopback / private IP subnets
        if ("127.0.0.1".equals(cleanIp) || "0:0:0:0:0:0:0:1".equals(cleanIp) || "localhost".equals(cleanIp) || cleanIp.startsWith("192.168.") || cleanIp.startsWith("10.") || cleanIp.startsWith("172.16.") || cleanIp.startsWith("172.31.")) {
            return new LocationResult(fallbackCountry, fallbackState, fallbackCity, fallbackLatitude, fallbackLongitude, true);
        }

        if (dbReader == null) {
            return unknown();
        }

        try {
            InetAddress ip = InetAddress.getByName(cleanIp);
            CityResponse response = dbReader.city(ip);
            
            String country = response.getCountry() != null && response.getCountry().getName() != null 
                    ? response.getCountry().getName() : "Unknown";
            String state = response.getMostSpecificSubdivision() != null && response.getMostSpecificSubdivision().getName() != null 
                    ? response.getMostSpecificSubdivision().getName() : "Unknown";
            String city = response.getCity() != null && response.getCity().getName() != null 
                    ? response.getCity().getName() : "Unknown";
            double latitude = response.getLocation() != null && response.getLocation().getLatitude() != null 
                    ? response.getLocation().getLatitude() : 0.0;
            double longitude = response.getLocation() != null && response.getLocation().getLongitude() != null 
                    ? response.getLocation().getLongitude() : 0.0;

            return new LocationResult(country, state, city, latitude, longitude, false);
        } catch (IOException | GeoIp2Exception e) {
            log.warn("Failed to geolocate IP: {} - {}", cleanIp, e.getMessage());
            return unknown();
        }
    }

    private LocationResult unknown() {
        return new LocationResult("Unknown", "Unknown", "Unknown", 0.0, 0.0, false);
    }
}

