package com.eventsphere.backend.service;

import java.time.LocalDateTime;
import java.util.List;

import org.springframework.stereotype.Service;

import com.eventsphere.backend.entity.Event;
import com.eventsphere.backend.entity.Registration;
import com.eventsphere.backend.entity.RegistrationStatus;
import com.eventsphere.backend.entity.User;
import com.eventsphere.backend.repository.RegistrationRepository;

@Service
public class RegistrationService {

    private final RegistrationRepository registrationRepository;
    private final EventService eventService;
    private final TicketService ticketService;

    public RegistrationService(RegistrationRepository registrationRepository, EventService eventService , TicketService ticketService) {
        this.registrationRepository = registrationRepository;
        this.eventService = eventService;
        this.ticketService = ticketService;
    }

    public Registration registerForEvent(Long eventId, User user) {
        Event event = eventService.getEventById(eventId);

        if (registrationRepository.existsByUserIdAndEventId(user.getId(), eventId)) {
            throw new IllegalStateException("You are already registered for this event");
        }

        Registration registration = new Registration();
        registration.setUser(user);
        registration.setEvent(event);
        registration.setStatus(RegistrationStatus.CONFIRMED);
        registration.setRegisteredAt(LocalDateTime.now());

        Registration saved = registrationRepository.save(registration);

        ticketService.issueTicket(saved);
        return saved;

    }

    public List<Registration> getMyRegistrations(Long userId) {
        return registrationRepository.findByUserId(userId);
    }

    public List<Registration> getEventRegistrations(Long eventId) {
        return registrationRepository.findByEventId(eventId);
    }
}
