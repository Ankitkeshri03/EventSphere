package com.eventsphere.backend.controller;

import java.util.List;
import java.util.stream.Collectors;

import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RestController;

import com.eventsphere.backend.dto.AttendeeResponse;
import com.eventsphere.backend.dto.RegistrationResponse;
import com.eventsphere.backend.entity.Registration;
import com.eventsphere.backend.entity.Ticket;
import com.eventsphere.backend.entity.User;
import com.eventsphere.backend.service.RegistrationService;
import com.eventsphere.backend.service.TicketService;
import com.eventsphere.backend.service.UserService;

@RestController
public class RegistrationController {

    private final RegistrationService registrationService;
    private final UserService userService;
    private final TicketService ticketService;

    public RegistrationController(RegistrationService registrationService, UserService userService,TicketService ticketService) {
        this.registrationService = registrationService;
        this.userService = userService;
        this.ticketService = ticketService;
    }

    @PostMapping("/events/{id}/register")
    @PreAuthorize("hasRole('PARTICIPANT')")
    public ResponseEntity<RegistrationResponse> register(@PathVariable Long id, Authentication authentication) {
        User user = userService.getByEmail(authentication.getName());
        Registration registration = registrationService.registerForEvent(id, user);
        return ResponseEntity.ok(toResponse(registration));
    }

    @GetMapping("/registrations/me")
    public ResponseEntity<List<RegistrationResponse>> getMyRegistrations(Authentication authentication) {
        User user = userService.getByEmail(authentication.getName());
        List<RegistrationResponse> registrations = registrationService.getMyRegistrations(user.getId())
                .stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
        return ResponseEntity.ok(registrations);
    }

    @GetMapping("/events/{id}/attendees")
    public ResponseEntity<List<AttendeeResponse>> getAttendees(@PathVariable Long id) {
        List<AttendeeResponse> attendees = registrationService.getEventRegistrations(id)
                .stream()
                .map(r -> new AttendeeResponse(r.getUser().getId(), r.getUser().getName()))
                .collect(Collectors.toList());

        return ResponseEntity.ok(attendees);
    }

    private RegistrationResponse toResponse(Registration r) {
        Ticket ticket = ticketService.getTicketByRegistrationId(r.getId());
        return new RegistrationResponse(
                r.getId(), r.getEvent().getId(), r.getEvent().getTitle(),
                r.getUser().getId(), r.getUser().getName(), r.getStatus(),
                r.getRegisteredAt(), ticket.getQrCode()
        );
    }
}