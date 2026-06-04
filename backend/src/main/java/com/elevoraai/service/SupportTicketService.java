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

    public List<TicketResponse> listTickets(Long tenantId, Long userId) {
        return jdbcTemplate.query(
                "SELECT id, tenant_id, user_id, subject, description, priority, status, created_at, updated_at "
                        + "FROM support_tickets WHERE tenant_id = ? AND user_id = ? ORDER BY created_at DESC",
                this::mapTicket,
                tenantId,
                userId);
    }

    public TicketResponse findById(Long tenantId, Long ticketId) {
        return jdbcTemplate.queryForObject(
                "SELECT id, tenant_id, user_id, subject, description, priority, status, created_at, updated_at "
                        + "FROM support_tickets WHERE tenant_id = ? AND id = ?",
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

    private TicketResponse mapTicket(ResultSet rs, int rowNum) throws SQLException {
        return new TicketResponse(
                rs.getLong("id"),
                rs.getLong("tenant_id"),
                rs.getLong("user_id"),
                rs.getString("subject"),
                rs.getString("description"),
                rs.getString("priority"),
                rs.getString("status"),
                rs.getTimestamp("created_at").toInstant(),
                rs.getTimestamp("updated_at").toInstant());
    }

    public record CreateTicketRequest(String subject, String description, String priority) {
    }

    public record TicketResponse(Long id, Long tenantId, Long userId, String subject, String description, String priority, String status, Instant createdAt, Instant updatedAt) {
    }
}
