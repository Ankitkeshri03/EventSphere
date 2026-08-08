package com.eventsphere.backend.service;

import com.eventsphere.backend.entity.Event;
import com.eventsphere.backend.entity.EventStatus;
import com.eventsphere.backend.entity.Registration;
import com.eventsphere.backend.entity.RegistrationStatus;
import com.eventsphere.backend.entity.User;
import com.eventsphere.backend.repository.EventRepository;
import com.eventsphere.backend.repository.RegistrationRepository;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class RecommendationService {

    private static final int MAX_RECOMMENDATIONS = 20;
    // A repeat organizer is a stronger signal than one shared word, but shouldn't
    // drown out an event that matches on several keywords.
    private static final double ORGANIZER_AFFINITY_WEIGHT = 3.0;
    private static final double PEER_REGISTRATION_WEIGHT = 1.5;

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
        // Cancelled registrations shouldn't count as "the user is interested in this"
        // or block the event from being recommended again later.
        List<Registration> activeRegistrations = registrationRepository.findByUserId(user.getId()).stream()
                .filter(r -> r.getStatus() == RegistrationStatus.CONFIRMED)
                .collect(Collectors.toList());

        Set<Long> alreadyRegisteredIds = activeRegistrations.stream()
                .map(r -> r.getEvent().getId())
                .collect(Collectors.toSet());

        // Only ever recommend events a person could actually still register for.
        List<Event> candidates = eventRepository.findByStatus(EventStatus.PUBLISHED).stream()
                .filter(e -> !alreadyRegisteredIds.contains(e.getId()))
                .filter(e -> e.getDate().isAfter(LocalDateTime.now()))
                .collect(Collectors.toList());

        if (activeRegistrations.isEmpty()) {
            // No history yet -> best guess is "what's happening soonest".
            return candidates.stream()
                    .sorted(Comparator.comparing(Event::getDate))
                    .limit(MAX_RECOMMENDATIONS)
                    .collect(Collectors.toList());
        }

        // --- Build the user's interest profile from past registrations ---

        // Term frequency across past events: a word that recurs across several of the
        // user's past events is a stronger signal than one that showed up once.
        Map<String, Long> termWeights = activeRegistrations.stream()
                .flatMap(r -> extractWords(r.getEvent()).stream())
                .collect(Collectors.groupingBy(w -> w, Collectors.counting()));

        Set<Long> pastOrganizerIds = activeRegistrations.stream()
                .map(r -> r.getEvent().getOrganizer().getId())
                .collect(Collectors.toSet());

        // Collaborative signal: for each event the user attended, find other attendees,
        // then see what else those attendees registered for. Frequent overlap is a vote.
        Map<Long, Long> peerEventCounts = activeRegistrations.stream()
                .flatMap(r -> registrationRepository.findByEventId(r.getEvent().getId()).stream())
                .filter(peerReg -> peerReg.getStatus() == RegistrationStatus.CONFIRMED)
                .filter(peerReg -> !peerReg.getUser().getId().equals(user.getId()))
                .flatMap(peerReg -> registrationRepository.findByUserId(peerReg.getUser().getId()).stream())
                .filter(peerReg -> peerReg.getStatus() == RegistrationStatus.CONFIRMED)
                .map(peerReg -> peerReg.getEvent().getId())
                .filter(eventId -> !alreadyRegisteredIds.contains(eventId))
                .collect(Collectors.groupingBy(id -> id, Collectors.counting()));

        return candidates.stream()
                .map(e -> Map.entry(e, score(e, termWeights, pastOrganizerIds, peerEventCounts)))
                .filter(entry -> entry.getValue() > 0)
                .sorted(
                        Comparator.<Map.Entry<Event, Double>>comparingDouble(Map.Entry::getValue).reversed()
                                .thenComparing(entry -> entry.getKey().getDate())
                )
                .map(Map.Entry::getKey)
                .limit(MAX_RECOMMENDATIONS)
                .collect(Collectors.toList());
    }

    private double score(Event event, Map<String, Long> termWeights, Set<Long> pastOrganizerIds,
                          Map<Long, Long> peerEventCounts) {
        double contentScore = extractWords(event).stream()
                .mapToLong(w -> termWeights.getOrDefault(w, 0L))
                .sum();

        double organizerScore = pastOrganizerIds.contains(event.getOrganizer().getId())
                ? ORGANIZER_AFFINITY_WEIGHT : 0;

        double peerScore = peerEventCounts.getOrDefault(event.getId(), 0L) * PEER_REGISTRATION_WEIGHT;

        return contentScore + organizerScore + peerScore;
    }

    private Set<String> extractWords(Event event) {
        String text = event.getTitle() + " " + (event.getDescription() != null ? event.getDescription() : "");
        return Arrays.stream(text.toLowerCase().split("\\W+"))
                .filter(w -> w.length() > 2 && !STOP_WORDS.contains(w))
                .collect(Collectors.toSet());
    }
}
