package com.eventsphere.backend.dto;

public class AttendeeResponse {
    private Long userId;
    private String userName;

    public AttendeeResponse(Long userId, String userName) {
        this.userId = userId;
        this.userName = userName;
    }

    public Long getUserId() { return userId; }
    public String getUserName() { return userName; }
}
