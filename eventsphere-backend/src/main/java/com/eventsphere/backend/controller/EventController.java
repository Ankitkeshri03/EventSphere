package com.eventsphere.backend.controller;

import java.util.List;
import java.util.stream.Collectors;

import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.eventsphere.backend.dto.AdminEventResponse;
import com.eventsphere.backend.dto.EventRequest;
import com.eventsphere.backend.dto.EventResponse;
import com.eventsphere.backend.entity.Event;
import com.eventsphere.backend.entity.User;
import com.eventsphere.backend.service.EventService;
import com.eventsphere.backend.service.RecommendationService;
import com.eventsphere.backend.service.RegistrationService;
import com.eventsphere.backend.service.UserService;

import jakarta.validation.Valid;

@RestController
@RequestMapping("/events")
public class EventController {

    private final EventService eventService;
    private final UserService userService;
    private final RegistrationService registrationService;
    private final RecommendationService recommendationService;

    public EventController(EventService eventService, UserService userService,
                            RegistrationService registrationService,
                            RecommendationService recommendationService) {
        this.eventService = eventService;
        this.userService = userService;
        this.registrationService = registrationService;
        this.recommendationService = recommendationService;
    }

    @PostMapping
    @PreAuthorize("hasRole('ORGANIZER')")
    public ResponseEntity<EventResponse> createEvent(@Valid @RequestBody EventRequest request,
                                                       Authentication authentication) {
        User organizer = userService.getByEmail(authentication.getName());

        Event event = eventService.createEvent(
                request.getTitle(), request.getDescription(), request.getLocation(),
                request.getDate(), request.getCapacity(), organizer
        );

        return ResponseEntity.ok(toResponse(event));
    }

    @GetMapping
    public ResponseEntity<List<EventResponse>> getAllEvents() {
        List<EventResponse> events = eventService.getAllEvents()
                .stream()
                .map(this::toResponse)
                .collect(Collectors.toList());

        return ResponseEntity.ok(events);
    }

    @GetMapping("/mine")
    @PreAuthorize("hasRole('ORGANIZER')")
    public ResponseEntity<List<EventResponse>> getMyEvents(Authentication authentication) {
        User organizer = userService.getByEmail(authentication.getName());

        List<EventResponse> events = eventService.getEventsByOrganizer(organizer.getId())
                .stream()
                .map(this::toResponse)
                .collect(Collectors.toList());

        return ResponseEntity.ok(events);
    }

    @GetMapping("/overview")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<List<AdminEventResponse>> getEventsOverview() {
        List<AdminEventResponse> overview = eventService.getAllEvents()
                .stream()
                .map(event -> new AdminEventResponse(
                        event.getId(), event.getTitle(), event.getDate(), event.getLocation(), event.getCapacity(),
                        event.getStatus(), event.getOrganizer().getId(), event.getOrganizer().getName(),
                        registrationService.getEventRegistrations(event.getId()).size()
                ))
                .collect(Collectors.toList());

        return ResponseEntity.ok(overview);
    }

    @GetMapping("/search")
    public ResponseEntity<List<EventResponse>> searchEvents(@RequestParam String keyword) {
        List<EventResponse> events = eventService.searchEvents(keyword)
                .stream()
                .map(this::toResponse)
                .collect(Collectors.toList());

        return ResponseEntity.ok(events);
    }

    @GetMapping("/recommended")
    public ResponseEntity<List<EventResponse>> getRecommendedEvents(Authentication authentication) {
        User user = userService.getByEmail(authentication.getName());
        List<EventResponse> events = recommendationService.getRecommendedEvents(user)
                .stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
        return ResponseEntity.ok(events);
    }

    @GetMapping("/{id}")
    public ResponseEntity<EventResponse> getEvent(@PathVariable Long id) {
        Event event = eventService.getEventById(id);
        return ResponseEntity.ok(toResponse(event));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ORGANIZER')")
    public ResponseEntity<EventResponse> updateEvent(@PathVariable Long id,
                                                        @Valid @RequestBody EventRequest request,
                                                        Authentication authentication) {
        User requester = userService.getByEmail(authentication.getName());

        Event event = eventService.updateEvent(
                id, request.getTitle(), request.getDescription(), request.getLocation(),
                request.getDate(), request.getCapacity(), requester.getId()
        );

        return ResponseEntity.ok(toResponse(event));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ORGANIZER')")
    public ResponseEntity<Void> deleteEvent(@PathVariable Long id, Authentication authentication) {
        User requester = userService.getByEmail(authentication.getName());
        eventService.deleteEvent(id, requester.getId());
        return ResponseEntity.noContent().build();
    }

    private EventResponse toResponse(Event event) {
        return new EventResponse(
                event.getId(), event.getTitle(), event.getDescription(), event.getLocation(),
                event.getDate(), event.getCapacity(), event.getStatus(),
                event.getOrganizer().getId(), event.getOrganizer().getName(), event.getCreatedAt()
        );
    }
}