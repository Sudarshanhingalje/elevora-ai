package com.elevoraai.controller;

import com.elevoraai.config.SecurityConfig.JwtPrincipal;
import com.elevoraai.service.GymAiService;
import com.elevoraai.service.GymAiService.GymMemberRequest;
import com.elevoraai.service.GymAiService.GymMemberResponse;
import com.elevoraai.service.GymAiService.ReminderResponse;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Pattern;
import java.util.List;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@Validated
@RestController
@RequestMapping("/api/gym-ai")
public class GymAiController {

    private final GymAiService gymAiService;

    public GymAiController(GymAiService gymAiService) {
        this.gymAiService = gymAiService;
    }

    @GetMapping("/members")
    public List<GymMemberResponse> listMembers(
            @AuthenticationPrincipal JwtPrincipal principal,
            @RequestParam(required = false) @Pattern(regexp = "^(ACTIVE|EXPIRED|PAUSED)$") String status) {
        return gymAiService.listMembers(principal, status);
    }

    @PostMapping("/members")
    public GymMemberResponse createMember(
            @AuthenticationPrincipal JwtPrincipal principal,
            @Valid @RequestBody GymMemberRequest request) {
        return gymAiService.createMember(principal, request);
    }

    @PostMapping("/members/{memberId}/reminders")
    public ReminderResponse queueReminder(
            @AuthenticationPrincipal JwtPrincipal principal,
            @PathVariable Long memberId) {
        return gymAiService.queueReminder(principal, memberId);
    }
}
