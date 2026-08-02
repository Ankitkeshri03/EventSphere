package com.eventsphere.backend.controller;

import com.eventsphere.backend.dto.GenerateDescriptionRequest;
import com.eventsphere.backend.dto.GenerateDescriptionResponse;
import com.eventsphere.backend.service.AIService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/ai")
public class AIController {

    private final AIService aiService;

    public AIController(AIService aiService) {
        this.aiService = aiService;
    }

    @PostMapping("/generate-description")
    @PreAuthorize("hasRole('ORGANIZER')")
    public ResponseEntity<GenerateDescriptionResponse> generateDescription(
            @Valid @RequestBody GenerateDescriptionRequest request) {

        String description = aiService.generateEventDescription(request.getKeywords());
        return ResponseEntity.ok(new GenerateDescriptionResponse(description));
    }
}
