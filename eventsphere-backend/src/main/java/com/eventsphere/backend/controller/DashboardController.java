package com.eventsphere.backend.controller;

import com.eventsphere.backend.dto.EventDashboardResponse;
import com.eventsphere.backend.entity.Event;
import com.eventsphere.backend.entity.User;
import com.eventsphere.backend.service.AttendanceService;
import com.eventsphere.backend.service.EventService;
import com.eventsphere.backend.service.RegistrationService;
import com.eventsphere.backend.service.UserService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.stream.Collectors;

@RestController
public class DashboardController {

    private final EventService eventService;
    private final RegistrationService registrationService;
    private final AttendanceService attendanceService;
    private final UserService userService;

    public DashboardController(EventService eventService, RegistrationService registrationService,
                                AttendanceService attendanceService, UserService userService) {
        this.eventService = eventService;
        this.registrationService = registrationService;
        this.attendanceService = attendanceService;
        this.userService = userService;
    }

    @GetMapping("/events/{id}/dashboard")
    @PreAuthorize("hasRole('ORGANIZER')")
    public ResponseEntity<EventDashboardResponse> getDashboard(@PathVariable Long id, Authentication authentication) {
        Event event = eventService.getEventById(id);
        User requester = userService.getByEmail(authentication.getName());

        if (!event.getOrganizer().getId().equals(requester.getId())) {
            throw new SecurityException("You are not the organizer of this event");
        }

        int totalRegistrations = registrationService.getEventRegistrations(id).size();

        List<String> checkedInNames = attendanceService.getAttendanceForEvent(id)
                .stream()
                .map(a -> a.getTicket().getRegistration().getUser().getName())
                .collect(Collectors.toList());

        EventDashboardResponse response = new EventDashboardResponse(
                event.getId(), event.getTitle(), totalRegistrations,
                checkedInNames.size(), checkedInNames
        );

        return ResponseEntity.ok(response);
    }
}
