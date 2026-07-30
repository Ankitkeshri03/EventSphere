package com.eventsphere.backend.dto;

import com.eventsphere.backend.entity.RegistrationStatus;

import java.time.LocalDateTime;

public class RegistrationResponse {
    private Long id;
    private Long eventId;
    private String eventTitle;
    private Long userId;
    private String userName;
    private RegistrationStatus status;
    private LocalDateTime registeredAt;
    private String qrCode;

    public RegistrationResponse(Long id, Long eventId, String eventTitle, Long userId,
                                 String userName, RegistrationStatus status, LocalDateTime registeredAt,
                                 String qrCode) {
        this.id = id;
        this.eventId = eventId;
        this.eventTitle = eventTitle;
        this.userId = userId;
        this.userName = userName;
        this.status = status;
        this.registeredAt = registeredAt;
        this.qrCode = qrCode;
    }

    public Long getId() { return id; }
    public Long getEventId() { return eventId; }
    public String getEventTitle() { return eventTitle; }
    public Long getUserId() { return userId; }
    public String getUserName() { return userName; }
    public RegistrationStatus getStatus() { return status; }
    public LocalDateTime getRegisteredAt() { return registeredAt; }
    public String getQrCode() { return qrCode; }
}
