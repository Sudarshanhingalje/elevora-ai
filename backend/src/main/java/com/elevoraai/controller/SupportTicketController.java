package com.elevoraai.controller;

import com.elevoraai.config.SecurityConfig.JwtPrincipal;
import com.elevoraai.service.SupportTicketService;
import com.elevoraai.service.SupportTicketService.CreateTicketRequest;
import com.elevoraai.service.SupportTicketService.TicketResponse;
import java.util.List;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/support/tickets")
public class SupportTicketController {

    private final SupportTicketService supportTicketService;

    public SupportTicketController(SupportTicketService supportTicketService) {
        this.supportTicketService = supportTicketService;
    }

    @PostMapping
    public TicketResponse createTicket(
            @AuthenticationPrincipal JwtPrincipal principal,
            @RequestBody CreateTicketRequest request) {
        return supportTicketService.createTicket(principal.tenantId(), principal.userId(), request);
    }

    @GetMapping
    public List<TicketResponse> listTickets(@AuthenticationPrincipal JwtPrincipal principal) {
        return supportTicketService.listTickets(principal.tenantId(), principal.userId());
    }

    @GetMapping("/{id}")
    public TicketResponse getTicket(
            @AuthenticationPrincipal JwtPrincipal principal,
            @PathVariable Long id) {
        return supportTicketService.findById(principal.tenantId(), id);
    }

    @PutMapping("/{id}/status")
    public TicketResponse updateStatus(
            @AuthenticationPrincipal JwtPrincipal principal,
            @PathVariable Long id,
            @RequestParam String status) {
        return supportTicketService.updateStatus(principal.tenantId(), id, status);
    }
}
