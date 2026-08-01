package com.eventsphere.backend.dto;

import java.time.LocalDateTime;

import com.eventsphere.backend.entity.OrganizerRequestStatus;

public class OrganizerRequestResponse {
    private Long id;
    private Long userId;
    private String userName;
    private String userEmail;
    private String reason;
    private OrganizerRequestStatus status;
    private LocalDateTime createdAt;

    public OrganizerRequestResponse(Long id, Long userId, String userName, String userEmail,
                                     String reason, OrganizerRequestStatus status, LocalDateTime createdAt) {
        this.id = id;
        this.userId = userId;
        this.userName = userName;
        this.userEmail = userEmail;
        this.reason = reason;
        this.status = status;
        this.createdAt = createdAt;
    }

    public Long getId() { return id; }
    public Long getUserId() { return userId; }
    public String getUserName() { return userName; }
    public String getUserEmail() { return userEmail; }
    public String getReason() { return reason; }
    public OrganizerRequestStatus getStatus() { return status; }
    public LocalDateTime getCreatedAt() { return createdAt; }
}
