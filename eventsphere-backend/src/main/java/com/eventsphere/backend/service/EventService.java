package com.eventsphere.backend.service;

import java.time.LocalDateTime;
import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.eventsphere.backend.entity.Event;
import com.eventsphere.backend.entity.EventStatus;
import com.eventsphere.backend.entity.User;
import com.eventsphere.backend.repository.EventRepository;

@Service
public class EventService {

    @Autowired
    private EventRepository eventRepository;



    //Create New Event
    public Event createEvent(String title, String description, String location,
                              LocalDateTime date, Integer capacity, User organizer) {
        Event event = new Event();
        event.setTitle(title);
        event.setDescription(description);
        event.setLocation(location);
        event.setDate(date);
        event.setCapacity(capacity);
        event.setOrganizer(organizer);
        event.setStatus(EventStatus.DRAFT);
        event.setCreatedAt(LocalDateTime.now());

        return eventRepository.save(event);
    }
    //Get All Events
    public List<Event> getAllEvents() {
        return eventRepository.findAll();
    }
    //Get Event By Id
    public Event getEventById(Long id) {
        return eventRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Event not found: " + id));
    }
    //Update Event - Only the organizer can update the event
    public Event updateEvent(Long id, String title, String description, String location,
                              LocalDateTime date, Integer capacity, Long requesterId) {
        Event event = getEventById(id);

        if (!event.getOrganizer().getId().equals(requesterId)) { // Check if the requester is the organizer
            throw new SecurityException("You are not the organizer of this event");
        }

        event.setTitle(title);
        event.setDescription(description);
        event.setLocation(location);
        event.setDate(date);
        event.setCapacity(capacity);

        return eventRepository.save(event);
    }
    //Delete Event - Only the organizer can delete the event
    public void deleteEvent(Long id, Long requesterId) {
        Event event = getEventById(id);

        if (!event.getOrganizer().getId().equals(requesterId)) {
            throw new SecurityException("You are not the organizer of this event");
        }

        eventRepository.delete(event);
    }
}