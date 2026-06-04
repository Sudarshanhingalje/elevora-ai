package com.elevoraai.controller;

import com.elevoraai.config.SecurityConfig.JwtPrincipal;
import com.elevoraai.service.InvoiceService;
import com.elevoraai.service.InvoiceService.InvoiceResponse;
import java.util.List;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/billing")
public class BillingController {

    private final InvoiceService invoiceService;

    public BillingController(InvoiceService invoiceService) {
        this.invoiceService = invoiceService;
    }

    @GetMapping("/invoices")
    public List<InvoiceResponse> listInvoices(@AuthenticationPrincipal JwtPrincipal principal) {
        return invoiceService.listUserInvoices(principal.tenantId(), principal.userId());
    }
}
