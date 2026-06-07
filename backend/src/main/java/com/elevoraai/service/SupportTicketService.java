package com.elevoraai.service;

import java.sql.ResultSet;
import java.sql.SQLException;
import java.time.Instant;
import java.util.List;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class SupportTicketService {

    private final JdbcTemplate jdbcTemplate;

    public SupportTicketService(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    @Transactional
    public TicketResponse createTicket(Long tenantId, Long userId, CreateTicketRequest request) {
        org.springframework.jdbc.support.KeyHolder keyHolder = new org.springframework.jdbc.support.GeneratedKeyHolder();
        jdbcTemplate.update(connection -> {
            java.sql.PreparedStatement ps = connection.prepareStatement(
                    "INSERT INTO support_tickets (tenant_id, user_id, subject, description, priority, status) "
                            + "VALUES (?, ?, ?, ?, ?, 'OPEN')",
                    java.sql.Statement.RETURN_GENERATED_KEYS);
            ps.setLong(1, tenantId);
            ps.setLong(2, userId);
            ps.setString(3, request.subject());
            ps.setString(4, request.description());
            ps.setString(5, request.priority());
            return ps;
        }, keyHolder);
        
        Long ticketId = keyHolder.getKey().longValue();
        return findById(tenantId, ticketId);
    }

    /** Returns only the requesting user's own tickets (customer view). */
    public List<TicketResponse> listTickets(Long tenantId, Long userId) {
        return jdbcTemplate.query(
                "SELECT t.id, t.tenant_id, t.user_id, u.email AS user_email, t.subject, t.description, t.priority, t.status, t.created_at, t.updated_at "
                        + "FROM support_tickets t "
                        + "JOIN users u ON u.id = t.user_id "
                        + "WHERE t.tenant_id = ? AND t.user_id = ? ORDER BY t.created_at DESC",
                this::mapTicket,
                tenantId,
                userId);
    }

    /** Returns all tickets for a given tenant — used by admin per-tenant drill-down. */
    public List<TicketResponse> listAllTicketsForTenant(Long tenantId) {
        return jdbcTemplate.query(
                "SELECT t.id, t.tenant_id, t.user_id, u.email AS user_email, t.subject, t.description, t.priority, t.status, t.created_at, t.updated_at "
                        + "FROM support_tickets t "
                        + "JOIN users u ON u.id = t.user_id "
                        + "WHERE t.tenant_id = ? ORDER BY t.created_at DESC",
                this::mapTicket,
                tenantId);
    }

    /**
     * Returns ALL tickets across every tenant — used by the Admin Dashboard Support tab.
     * No tenant filter: admins see everything.
     */
    public List<TicketResponse> listAllTickets() {
        return jdbcTemplate.query(
                "SELECT t.id, t.tenant_id, t.user_id, u.email AS user_email, t.subject, t.description, t.priority, t.status, t.created_at, t.updated_at "
                        + "FROM support_tickets t "
                        + "JOIN users u ON u.id = t.user_id "
                        + "ORDER BY t.created_at DESC",
                this::mapTicket);
    }

    public TicketResponse findById(Long tenantId, Long ticketId) {
        return jdbcTemplate.queryForObject(
                "SELECT t.id, t.tenant_id, t.user_id, u.email AS user_email, t.subject, t.description, t.priority, t.status, t.created_at, t.updated_at "
                        + "FROM support_tickets t "
                        + "JOIN users u ON u.id = t.user_id "
                        + "WHERE t.tenant_id = ? AND t.id = ?",
                this::mapTicket,
                tenantId,
                ticketId);
    }

    @Transactional
    public TicketResponse updateStatus(Long tenantId, Long ticketId, String status) {
        jdbcTemplate.update(
                "UPDATE support_tickets SET status = ? WHERE tenant_id = ? AND id = ?",
                status,
                tenantId,
                ticketId);
        return findById(tenantId, ticketId);
    }

    /**
     * Admin version of updateStatus — works on any ticket regardless of tenant.
     */
    @Transactional
    public TicketResponse adminUpdateStatus(Long ticketId, String status) {
        jdbcTemplate.update(
                "UPDATE support_tickets SET status = ? WHERE id = ?",
                status,
                ticketId);
        // Fetch back without tenant restriction
        return jdbcTemplate.queryForObject(
                "SELECT t.id, t.tenant_id, t.user_id, u.email AS user_email, t.subject, t.description, t.priority, t.status, t.created_at, t.updated_at "
                        + "FROM support_tickets t "
                        + "JOIN users u ON u.id = t.user_id "
                        + "WHERE t.id = ?",
                this::mapTicket,
                ticketId);
    }

    private TicketResponse mapTicket(ResultSet rs, int rowNum) throws SQLException {
        return new TicketResponse(
                rs.getLong("id"),
                rs.getLong("tenant_id"),
                rs.getLong("user_id"),
                rs.getString("user_email"),
                rs.getString("subject"),
                rs.getString("description"),
                rs.getString("priority"),
                rs.getString("status"),
                rs.getTimestamp("created_at").toInstant(),
                rs.getTimestamp("updated_at").toInstant());
    }

    public record CreateTicketRequest(String subject, String description, String priority) {
    }

    public record TicketResponse(
            Long id,
            Long tenantId,
            Long userId,
            String userEmail,
            String subject,
            String description,
            String priority,
            String status,
            Instant createdAt,
            Instant updatedAt) {
    }
}
