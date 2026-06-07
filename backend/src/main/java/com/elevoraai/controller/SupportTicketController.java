package com.elevoraai.controller;

import com.elevoraai.config.SecurityConfig.JwtPrincipal;
import com.elevoraai.service.SupportTicketService;
import com.elevoraai.service.SupportTicketService.CreateTicketRequest;
import com.elevoraai.service.SupportTicketService.TicketResponse;
import java.util.List;
import org.springframework.security.access.prepost.PreAuthorize;
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

    // ── Customer endpoints ────────────────────────────────────────────────────

    /** POST /api/support/tickets — customer creates a support ticket */
    @PostMapping
    public TicketResponse createTicket(
            @AuthenticationPrincipal JwtPrincipal principal,
            @RequestBody CreateTicketRequest request) {
        return supportTicketService.createTicket(principal.tenantId(), principal.userId(), request);
    }

    /** GET /api/support/tickets — customer lists their own tickets */
    @GetMapping
    public List<TicketResponse> listTickets(@AuthenticationPrincipal JwtPrincipal principal) {
        return supportTicketService.listTickets(principal.tenantId(), principal.userId());
    }

    /** GET /api/support/tickets/{id} — customer views a single ticket */
    @GetMapping("/{id}")
    public TicketResponse getTicket(
            @AuthenticationPrincipal JwtPrincipal principal,
            @PathVariable Long id) {
        return supportTicketService.findById(principal.tenantId(), id);
    }

    /** PUT /api/support/tickets/{id}/status — customer/tenant updates status */
    @PutMapping("/{id}/status")
    public TicketResponse updateStatus(
            @AuthenticationPrincipal JwtPrincipal principal,
            @PathVariable Long id,
            @RequestParam String status) {
        return supportTicketService.updateStatus(principal.tenantId(), id, status);
    }

    // ── Admin endpoints ───────────────────────────────────────────────────────

    /**
     * GET /api/support/tickets/admin/all
     * Admin-only: returns ALL support tickets across every tenant.
     * This is the endpoint used by the Admin Dashboard → Support tab.
     */
    @GetMapping("/admin/all")
    @PreAuthorize("hasRole('ADMIN')")
    public List<TicketResponse> adminListAllTickets() {
        return supportTicketService.listAllTickets();
    }

    /**
     * GET /api/support/tickets/admin/tenant/{tenantId}
     * Admin-only: returns all tickets for one specific tenant.
     */
    @GetMapping("/admin/tenant/{tenantId}")
    @PreAuthorize("hasRole('ADMIN')")
    public List<TicketResponse> adminListTicketsForTenant(@PathVariable Long tenantId) {
        return supportTicketService.listAllTicketsForTenant(tenantId);
    }

    /**
     * PUT /api/support/tickets/admin/{id}/status
     * Admin-only: update status of any ticket regardless of tenant.
     */
    @PutMapping("/admin/{id}/status")
    @PreAuthorize("hasRole('ADMIN')")
    public TicketResponse adminUpdateStatus(
            @PathVariable Long id,
            @RequestParam String status) {
        return supportTicketService.adminUpdateStatus(id, status);
    }
}
