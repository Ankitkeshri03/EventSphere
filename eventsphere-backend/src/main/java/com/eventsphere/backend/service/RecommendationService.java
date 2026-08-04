package com.eventsphere.backend.service;

import com.eventsphere.backend.entity.Event;
import com.eventsphere.backend.entity.User;
import com.eventsphere.backend.repository.EventRepository;
import com.eventsphere.backend.repository.RegistrationRepository;
import org.springframework.stereotype.Service;

import java.util.*;
import java.util.stream.Collectors;

@Service
public class RecommendationService {

    private final EventRepository eventRepository;
    private final RegistrationRepository registrationRepository;

    private static final Set<String> STOP_WORDS = Set.of(
            "the", "a", "an", "and", "for", "of", "to", "in", "on", "with", "workshop", "event"
    );

    public RecommendationService(EventRepository eventRepository, RegistrationRepository registrationRepository) {
        this.eventRepository = eventRepository;
        this.registrationRepository = registrationRepository;
    }

    public List<Event> getRecommendedEvents(User user) {
        var registrations = registrationRepository.findByUserId(user.getId());

        Set<Long> alreadyRegisteredIds = registrations.stream()
                .map(r -> r.getEvent().getId())
                .collect(Collectors.toSet());

        // No history yet -> fall back to all upcoming events
        if (registrations.isEmpty()) {
            return eventRepository.findAll().stream()
                    .filter(e -> !alreadyRegisteredIds.contains(e.getId()))
                    .collect(Collectors.toList());
        }

        // Extract keywords from titles/descriptions of past registrations
        Set<String> keywords = registrations.stream()
                .flatMap(r -> extractWords(r.getEvent()).stream())
                .collect(Collectors.toSet());

        return eventRepository.findAll().stream()
                .filter(e -> !alreadyRegisteredIds.contains(e.getId()))
                .filter(e -> matchesAnyKeyword(e, keywords))
                .collect(Collectors.toList());
    }

    private Set<String> extractWords(Event event) {
        String text = event.getTitle() + " " + (event.getDescription() != null ? event.getDescription() : "");
        return Arrays.stream(text.toLowerCase().split("\\W+"))
                .filter(w -> w.length() > 2 && !STOP_WORDS.contains(w))
                .collect(Collectors.toSet());
    }

    private boolean matchesAnyKeyword(Event event, Set<String> keywords) {
        Set<String> eventWords = extractWords(event);
        return keywords.stream().anyMatch(eventWords::contains);
    }
}
