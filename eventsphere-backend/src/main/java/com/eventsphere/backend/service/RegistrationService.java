package com.eventsphere.backend.service;

import com.eventsphere.backend.entity.Event;
import com.eventsphere.backend.entity.Registration;
import com.eventsphere.backend.entity.RegistrationStatus;
import com.eventsphere.backend.entity.User;
import com.eventsphere.backend.repository.RegistrationRepository;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;

@Service
public class RegistrationService {

    private final RegistrationRepository registrationRepository;
    private final EventService eventService;

    public RegistrationService(RegistrationRepository registrationRepository, EventService eventService) {
        this.registrationRepository = registrationRepository;
        this.eventService = eventService;
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

        return registrationRepository.save(registration);
    }

    public List<Registration> getMyRegistrations(Long userId) {
        return registrationRepository.findByUserId(userId);
    }

    public List<Registration> getEventRegistrations(Long eventId) {
        return registrationRepository.findByEventId(eventId);
    }
}
