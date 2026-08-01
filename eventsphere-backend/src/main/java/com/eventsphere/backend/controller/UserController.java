package com.eventsphere.backend.controller;

import java.util.List;
import java.util.stream.Collectors;

import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.eventsphere.backend.dto.UserResponse;
import com.eventsphere.backend.entity.Role;
import com.eventsphere.backend.entity.User;
import com.eventsphere.backend.service.UserService;

@RestController
@RequestMapping("/users")
public class UserController {

    private final UserService userService;

    public UserController(UserService userService) {
        this.userService = userService;
    }

    @GetMapping("/me")
    public ResponseEntity<UserResponse> getCurrentUser(Authentication authentication) {
        String email = authentication.getName(); // set by our JwtAuthFilter

        User user = userService.getByEmail(email);

        UserResponse response = new UserResponse(
                user.getId(), user.getName(), user.getEmail(), user.getRole(), user.getCreatedAt()
        );

        return ResponseEntity.ok(response);
    }

    @GetMapping("/participants")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<List<UserResponse>> getParticipants() {
        List<UserResponse> participants = userService.getByRole(Role.PARTICIPANT)
                .stream()
                .map(u -> new UserResponse(u.getId(), u.getName(), u.getEmail(), u.getRole(), u.getCreatedAt()))
                .collect(Collectors.toList());

        return ResponseEntity.ok(participants);
    }

    @GetMapping("/organizers")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<List<UserResponse>> getOrganizers() {
        List<UserResponse> organizers = userService.getByRole(Role.ORGANIZER)
                .stream()
                .map(u -> new UserResponse(u.getId(), u.getName(), u.getEmail(), u.getRole(), u.getCreatedAt()))
                .collect(Collectors.toList());

        return ResponseEntity.ok(organizers);
    }
}