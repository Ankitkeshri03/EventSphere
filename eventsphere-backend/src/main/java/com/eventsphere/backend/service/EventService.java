package com.eventsphere.backend.service;

import java.time.LocalDateTime;
import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.eventsphere.backend.entity.Event;
import com.eventsphere.backend.entity.EventStatus;
import com.eventsphere.backend.entity.Registration;
import com.eventsphere.backend.entity.User;
import com.eventsphere.backend.repository.AttendanceRepository;
import com.eventsphere.backend.repository.EventRepository;
import com.eventsphere.backend.repository.RegistrationRepository;
import com.eventsphere.backend.repository.TicketRepository;

@Service
public class EventService {

    @Autowired
    private EventRepository eventRepository;

    private final RegistrationRepository registrationRepository;
    private final TicketRepository ticketRepository;
    private final AttendanceRepository attendanceRepository;

    public EventService(RegistrationRepository registrationRepository, TicketRepository ticketRepository,
                         AttendanceRepository attendanceRepository) {
        this.registrationRepository = registrationRepository;
        this.ticketRepository = ticketRepository;
        this.attendanceRepository = attendanceRepository;
    }



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
    //Get events organized by a specific user
    public List<Event> getEventsByOrganizer(Long organizerId) {
        return eventRepository.findByOrganizerId(organizerId);
    }
    //Search events by title or description
    public List<Event> searchEvents(String keyword) {
        return eventRepository.findByTitleContainingIgnoreCaseOrDescriptionContainingIgnoreCase(keyword, keyword);
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

        // Registrations/tickets/attendance all reference this event via FKs —
        // clear them out first or the delete below violates referential integrity.
        attendanceRepository.deleteAll(attendanceRepository.findByTicket_Registration_Event_Id(id));

        List<Registration> registrations = registrationRepository.findByEventId(id);
        for (Registration registration : registrations) {
            ticketRepository.findByRegistrationId(registration.getId()).ifPresent(ticketRepository::delete);
        }
        registrationRepository.deleteAll(registrations);

        eventRepository.delete(event);
    }
}