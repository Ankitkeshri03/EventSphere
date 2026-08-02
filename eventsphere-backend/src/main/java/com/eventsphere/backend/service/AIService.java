package com.eventsphere.backend.service;

import org.springframework.ai.chat.client.ChatClient;
import org.springframework.stereotype.Service;

@Service
public class AIService {

    private final ChatClient chatClient;

    public AIService(ChatClient chatClient) {
        this.chatClient = chatClient;
    }

    public String generateEventDescription(String keywords) {
        String prompt = """
                Write a short, engaging event description (2-3 sentences, no more than 60 words)
                for an event about: %s

                Write it in a welcoming, professional tone suitable for a public event listing.
                Do not include a title or heading, just the description text itself.
                """.formatted(keywords);

        return chatClient.prompt()
                .user(prompt)
                .call()
                .content();
    }
}
