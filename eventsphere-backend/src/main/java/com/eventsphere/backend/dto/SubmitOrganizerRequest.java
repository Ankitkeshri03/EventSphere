package com.eventsphere.backend.dto;

import jakarta.validation.constraints.NotBlank;

public class SubmitOrganizerRequest {

    @NotBlank(message = "Please tell us why you'd like to become an organizer")
    private String reason;

    public String getReason() { return reason; }
    public void setReason(String reason) { this.reason = reason; }
}
