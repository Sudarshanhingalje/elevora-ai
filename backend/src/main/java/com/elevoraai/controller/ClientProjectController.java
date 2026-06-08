package com.elevoraai.controller;

import com.elevoraai.config.SecurityConfig.JwtPrincipal;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.time.LocalDate;
import java.util.List;
import org.springframework.http.ResponseEntity;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/admin/client-projects")
@PreAuthorize("hasRole('ADMIN')")
public class ClientProjectController {

    private final JdbcTemplate jdbcTemplate;

    public ClientProjectController(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    @GetMapping
    public List<ClientProject> listProjects(@AuthenticationPrincipal JwtPrincipal principal) {
        return jdbcTemplate.query(
                "SELECT id, tenant_id, client_name, project_name, progress, due_date, status FROM client_projects WHERE tenant_id = ? ORDER BY id DESC",
                this::mapRow,
                principal.tenantId());
    }

    @PostMapping
    public ClientProject createProject(
            @AuthenticationPrincipal JwtPrincipal principal,
            @Valid @RequestBody ClientProjectRequest request) {
        jdbcTemplate.update(
                "INSERT INTO client_projects (tenant_id, client_name, project_name, progress, due_date, status) VALUES (?, ?, ?, ?, ?, ?)",
                principal.tenantId(),
                request.clientName(),
                request.projectName(),
                request.progress(),
                request.dueDate(),
                request.status());

        Long id = jdbcTemplate.queryForObject("SELECT LAST_INSERT_ID()", Long.class);
        return new ClientProject(id, principal.tenantId(), request.clientName(), request.projectName(), request.progress(), request.dueDate(), request.status());
    }

    @PutMapping("/{id}")
    public ResponseEntity<ClientProject> updateProject(
            @AuthenticationPrincipal JwtPrincipal principal,
            @PathVariable Long id,
            @Valid @RequestBody ClientProjectRequest request) {
        int updated = jdbcTemplate.update(
                "UPDATE client_projects SET client_name = ?, project_name = ?, progress = ?, due_date = ?, status = ? WHERE tenant_id = ? AND id = ?",
                request.clientName(),
                request.projectName(),
                request.progress(),
                request.dueDate(),
                request.status(),
                principal.tenantId(),
                id);

        if (updated == 0) {
            return ResponseEntity.notFound().build();
        }

        return ResponseEntity.ok(new ClientProject(id, principal.tenantId(), request.clientName(), request.projectName(), request.progress(), request.dueDate(), request.status()));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteProject(
            @AuthenticationPrincipal JwtPrincipal principal,
            @PathVariable Long id) {
        int deleted = jdbcTemplate.update(
                "DELETE FROM client_projects WHERE tenant_id = ? AND id = ?",
                principal.tenantId(),
                id);

        if (deleted == 0) {
            return ResponseEntity.notFound().build();
        }

        return ResponseEntity.noContent().build();
    }

    private ClientProject mapRow(ResultSet rs, int rowNum) throws SQLException {
        return new ClientProject(
                rs.getLong("id"),
                rs.getLong("tenant_id"),
                rs.getString("client_name"),
                rs.getString("project_name"),
                rs.getInt("progress"),
                rs.getDate("due_date").toLocalDate(),
                rs.getString("status"));
    }

    public record ClientProject(Long id, Long tenantId, String clientName, String projectName, int progress, LocalDate dueDate, String status) {}
    
    public record ClientProjectRequest(
            @NotBlank(message = "Client name is required")
            @Size(max = 255, message = "Client name cannot exceed 255 characters")
            String clientName,

            @NotBlank(message = "Project name is required")
            @Size(max = 255, message = "Project name cannot exceed 255 characters")
            String projectName,

            int progress,

            @NotNull(message = "Due date is required")
            LocalDate dueDate,

            @NotBlank(message = "Status is required")
            String status
    ) {}
}
