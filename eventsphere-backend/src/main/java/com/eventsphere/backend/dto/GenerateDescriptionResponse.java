package com.eventsphere.backend.dto;

public class GenerateDescriptionResponse {
    private String description;

    public GenerateDescriptionResponse(String description) {
        this.description = description;
    }

    public String getDescription() { return description; }
}
