package com.eventsphere.backend.dto;

import java.time.LocalDateTime;

public class AttendanceResponse {
    private Long id;
    private String qrCode;
    private String participantName;
    private String eventTitle;
    private LocalDateTime checkInTime;

    public AttendanceResponse(Long id, String qrCode, String participantName,
                               String eventTitle, LocalDateTime checkInTime) {
        this.id = id;
        this.qrCode = qrCode;
        this.participantName = participantName;
        this.eventTitle = eventTitle;
        this.checkInTime = checkInTime;
    }

    public Long getId() { return id; }
    public String getQrCode() { return qrCode; }
    public String getParticipantName() { return participantName; }
    public String getEventTitle() { return eventTitle; }
    public LocalDateTime getCheckInTime() { return checkInTime; }
}
