package com.eventsphere.backend.dto;

import jakarta.validation.constraints.NotBlank;

public class SendMessageRequest {

    @NotBlank(message = "Message content is required")
    private String content;

    public String getContent() { return content; }
    public void setContent(String content) { this.content = content; }
}
