package com.eventsphere.backend.dto;

import jakarta.validation.constraints.NotBlank;

public class GenerateDescriptionRequest {

    @NotBlank(message = "Please provide a topic or keywords")
    private String keywords;

    public String getKeywords() { return keywords; }
    public void setKeywords(String keywords) { this.keywords = keywords; }
}
