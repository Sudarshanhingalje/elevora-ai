package com.elevoraai.controller;

import com.elevoraai.config.SecurityConfig.JwtPrincipal;
import com.elevoraai.service.DeploymentLogsService;
import com.elevoraai.service.DeploymentLogsService.LogLineResponse;
import com.elevoraai.service.DeploymentService;
import com.elevoraai.service.DeploymentService.DeploymentRecord;
import com.elevoraai.service.OrderService;
import com.elevoraai.service.OrderService.OrderRecord;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import java.util.List;
import java.util.Map;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@Validated
@RestController
@RequestMapping("/api/deployments")
public class DeploymentController {

    private final DeploymentService deploymentService;
    private final DeploymentLogsService deploymentLogsService;
    private final OrderService orderService;

    public DeploymentController(
            DeploymentService deploymentService,
            DeploymentLogsService deploymentLogsService,
            OrderService orderService) {
        this.deploymentService = deploymentService;
        this.deploymentLogsService = deploymentLogsService;
        this.orderService = orderService;
    }

    /** GET /api/deployments — list all deployments for the tenant */
    @GetMapping
    public List<DeploymentRecord> listDeployments(@AuthenticationPrincipal JwtPrincipal principal) {
        return deploymentService.listDeployments(principal.tenantId());
    }

    /** GET /api/deployments/{id} — get one deployment */
    @GetMapping("/{id}")
    public DeploymentRecord getDeployment(
            @AuthenticationPrincipal JwtPrincipal principal,
            @PathVariable Long id) {
        return deploymentService.getDeployment(principal.tenantId(), id);
    }

    /** PUT /api/deployments/{id}/status — admin updates deployment status */
    @PutMapping("/{id}/status")
    public void updateStatus(
            @AuthenticationPrincipal JwtPrincipal principal,
            @PathVariable Long id,
            @RequestBody @NotBlank @Pattern(regexp = "^(PENDING|BUILDING|DEPLOYING|RUNNING|FAILED|STOPPED|COMPLETED)$") String status) {
        deploymentService.updateStatus(principal.tenantId(), id, status);
    }

    /** GET /api/deployments/{id}/logs — get deployment logs */
    @GetMapping("/{id}/logs")
    public List<LogLineResponse> getLogs(
            @AuthenticationPrincipal JwtPrincipal principal,
            @PathVariable Long id) {
        return deploymentLogsService.getLogs(principal, id);
    }

    /**
     * POST /api/deployments/deploy/{orderId}
     * Admin-only: manually trigger deployment for a paid order.
     * This is the endpoint called when the admin clicks the "Deploy" button.
     */
    @PreAuthorize("hasRole('ADMIN')")
    @PostMapping("/deploy/{orderId}")
    public ResponseEntity<Map<String, String>> deployOrder(
            @AuthenticationPrincipal JwtPrincipal principal,
            @PathVariable Long orderId) {
        OrderRecord order = orderService.findById(principal.tenantId(), orderId);
        deploymentService.deployPaidOrder(order);
        return ResponseEntity.ok(Map.of(
                "status", "success",
                "message", "Deployment triggered. Client will be notified by email when live."));
    }
}
