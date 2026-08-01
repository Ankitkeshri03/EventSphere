package com.eventsphere.backend.controller;

import java.util.List;
import java.util.stream.Collectors;

import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.eventsphere.backend.dto.OrganizerRequestResponse;
import com.eventsphere.backend.dto.SubmitOrganizerRequest;
import com.eventsphere.backend.entity.OrganizerRequest;
import com.eventsphere.backend.entity.User;
import com.eventsphere.backend.service.OrganizerRequestService;
import com.eventsphere.backend.service.UserService;

import jakarta.validation.Valid;

@RestController
@RequestMapping("/organizer-requests")
public class OrganizerRequestController {

    private final OrganizerRequestService organizerRequestService;
    private final UserService userService;

    public OrganizerRequestController(OrganizerRequestService organizerRequestService, UserService userService) {
        this.organizerRequestService = organizerRequestService;
        this.userService = userService;
    }

    @PostMapping
    public ResponseEntity<OrganizerRequestResponse> submit(@Valid @RequestBody SubmitOrganizerRequest request,
                                                             Authentication authentication) {
        User user = userService.getByEmail(authentication.getName());
        OrganizerRequest saved = organizerRequestService.submitRequest(user, request.getReason());
        return ResponseEntity.ok(toResponse(saved));
    }

    @GetMapping("/me")
    public ResponseEntity<List<OrganizerRequestResponse>> getMyRequests(Authentication authentication) {
        User user = userService.getByEmail(authentication.getName());
        List<OrganizerRequestResponse> requests = organizerRequestService.getMyRequests(user.getId())
                .stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
        return ResponseEntity.ok(requests);
    }

    @GetMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<List<OrganizerRequestResponse>> getPendingRequests() {
        List<OrganizerRequestResponse> requests = organizerRequestService.getPendingRequests()
                .stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
        return ResponseEntity.ok(requests);
    }

    @PostMapping("/{id}/approve")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<OrganizerRequestResponse> approve(@PathVariable Long id) {
        return ResponseEntity.ok(toResponse(organizerRequestService.approve(id)));
    }

    @PostMapping("/{id}/reject")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<OrganizerRequestResponse> reject(@PathVariable Long id) {
        return ResponseEntity.ok(toResponse(organizerRequestService.reject(id)));
    }

    private OrganizerRequestResponse toResponse(OrganizerRequest r) {
        return new OrganizerRequestResponse(
                r.getId(), r.getUser().getId(), r.getUser().getName(), r.getUser().getEmail(),
                r.getReason(), r.getStatus(), r.getCreatedAt()
        );
    }
}
