package com.eventsphere.backend.dto;

import com.eventsphere.backend.entity.EventStatus;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;
@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor

public class EventResponse {
    private Long id;
    private String title;
    private String description;
    private String location;
    private LocalDateTime date;
    private Integer capacity;
    private EventStatus status;
    private Long organizerId;
    private String organizerName;
    private LocalDateTime createdAt;
}