package com.eventsphere.backend.dto;

import java.time.LocalDateTime;

import com.eventsphere.backend.entity.EventStatus;

public class AdminEventResponse {
    private Long id;
    private String title;
    private LocalDateTime date;
    private String location;
    private Integer capacity;
    private EventStatus status;
    private Long organizerId;
    private String organizerName;
    private int registrationCount;

    public AdminEventResponse(Long id, String title, LocalDateTime date, String location, Integer capacity,
                               EventStatus status, Long organizerId, String organizerName, int registrationCount) {
        this.id = id;
        this.title = title;
        this.date = date;
        this.location = location;
        this.capacity = capacity;
        this.status = status;
        this.organizerId = organizerId;
        this.organizerName = organizerName;
        this.registrationCount = registrationCount;
    }

    public Long getId() { return id; }
    public String getTitle() { return title; }
    public LocalDateTime getDate() { return date; }
    public String getLocation() { return location; }
    public Integer getCapacity() { return capacity; }
    public EventStatus getStatus() { return status; }
    public Long getOrganizerId() { return organizerId; }
    public String getOrganizerName() { return organizerName; }
    public int getRegistrationCount() { return registrationCount; }
}
