package com.elevoraai.controller;

import java.net.InetSocketAddress;
import java.net.Socket;
import java.util.ArrayList;
import java.util.List;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * GET /api/admin/infra-health
 * Admin-only: probes each infrastructure service via TCP socket and returns UP/DOWN.
 */
@RestController
@RequestMapping("/api/admin/infra-health")
@PreAuthorize("hasRole('ADMIN')")
public class InfraHealthController {

    private static final int TIMEOUT_MS = 800;

    private static final List<ServiceDef> SERVICES = List.of(
            new ServiceDef("MySQL",      "localhost", 3307),
            new ServiceDef("Redis",      "localhost", 6379),
            new ServiceDef("n8n",        "localhost", 5678),
            new ServiceDef("Grafana",    "localhost", 3001),
            new ServiceDef("Prometheus", "localhost", 9090),
            new ServiceDef("Qdrant",     "localhost", 6333),
            new ServiceDef("MinIO",      "localhost", 9000),
            new ServiceDef("Ollama",     "localhost", 11434)
    );

    @GetMapping
    public List<ServiceStatus> checkAll() {
        List<ServiceStatus> result = new ArrayList<>();
        for (ServiceDef svc : SERVICES) {
            boolean reachable = isReachable(svc.host(), svc.port());
            result.add(new ServiceStatus(svc.name(), svc.port(), reachable ? "UP" : "DOWN", reachable));
        }
        return result;
    }

    private boolean isReachable(String host, int port) {
        try (Socket socket = new Socket()) {
            socket.connect(new InetSocketAddress(host, port), TIMEOUT_MS);
            return true;
        } catch (Exception e) {
            return false;
        }
    }

    public record ServiceDef(String name, String host, int port) {}
    public record ServiceStatus(String name, int port, String status, boolean up) {}
}
