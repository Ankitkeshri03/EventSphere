package com.eventsphere.backend.controller;

import java.util.List;
import java.util.stream.Collectors;

import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.eventsphere.backend.dto.MessageResponse;
import com.eventsphere.backend.dto.SendMessageRequest;
import com.eventsphere.backend.entity.Message;
import com.eventsphere.backend.entity.User;
import com.eventsphere.backend.service.MessageService;
import com.eventsphere.backend.service.UserService;

import jakarta.validation.Valid;

@RestController
@RequestMapping("/chat")
public class MessageController {

    private final MessageService messageService;
    private final UserService userService;

    public MessageController(MessageService messageService, UserService userService) {
        this.messageService = messageService;
        this.userService = userService;
    }

    @PostMapping("/messages/{receiverId}")
    public ResponseEntity<MessageResponse> sendMessage(@PathVariable Long receiverId,
                                                         @Valid @RequestBody SendMessageRequest request,
                                                         Authentication authentication) {
        User sender = userService.getByEmail(authentication.getName());
        User receiver = userService.getById(receiverId);

        Message message = messageService.sendMessage(sender, receiver, request.getContent());
        return ResponseEntity.ok(toResponse(message));
    }

    @GetMapping("/messages/{otherUserId}")
    public ResponseEntity<List<MessageResponse>> getConversation(@PathVariable Long otherUserId,
                                                                    Authentication authentication) {
        User user = userService.getByEmail(authentication.getName());

        List<MessageResponse> messages = messageService.getConversation(user.getId(), otherUserId)
                .stream()
                .map(this::toResponse)
                .collect(Collectors.toList());

        return ResponseEntity.ok(messages);
    }

    private MessageResponse toResponse(Message m) {
        return new MessageResponse(
                m.getId(), m.getSender().getId(), m.getSender().getName(),
                m.getReceiver().getId(), m.getContent(), m.getSentAt()
        );
    }
}
