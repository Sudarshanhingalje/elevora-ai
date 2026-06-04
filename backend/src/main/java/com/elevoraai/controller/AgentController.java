package com.elevoraai.controller;

import com.elevoraai.config.SecurityConfig.JwtPrincipal;
import com.elevoraai.service.AgentMonitoringService;
import com.elevoraai.service.AgentMonitoringService.AgentMonitorResponse;
import java.util.List;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/admin/agents")
@PreAuthorize("hasRole('ADMIN')")
public class AgentController {

    private final AgentMonitoringService agentMonitoringService;

    public AgentController(AgentMonitoringService agentMonitoringService) {
        this.agentMonitoringService = agentMonitoringService;
    }

    @GetMapping
    public List<AgentMonitorResponse> listAgents(@AuthenticationPrincipal JwtPrincipal principal) {
        return agentMonitoringService.listAgents(principal);
    }
}
