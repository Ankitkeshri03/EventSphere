package com.eventsphere.backend.controller;

import java.security.Principal;

import org.springframework.messaging.handler.annotation.MessageExceptionHandler;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.messaging.simp.annotation.SendToUser;
import org.springframework.stereotype.Controller;

import com.eventsphere.backend.dto.ChatMessageRequest;
import com.eventsphere.backend.dto.MessageResponse;
import com.eventsphere.backend.entity.Message;
import com.eventsphere.backend.entity.User;
import com.eventsphere.backend.service.MessageService;
import com.eventsphere.backend.service.UserService;

@Controller
public class ChatSocketController {

    private final MessageService messageService;
    private final UserService userService;
    private final SimpMessagingTemplate messagingTemplate;

    public ChatSocketController(MessageService messageService, UserService userService,
                                 SimpMessagingTemplate messagingTemplate) {
        this.messageService = messageService;
        this.userService = userService;
        this.messagingTemplate = messagingTemplate;
    }

    @MessageMapping("/chat.send")
    public void sendMessage(ChatMessageRequest request, Principal principal) {
        User sender = userService.getByEmail(principal.getName());
        User receiver = userService.getById(request.getReceiverId());

        Message saved = messageService.sendMessage(sender, receiver, request.getContent());

        MessageResponse response = new MessageResponse(
                saved.getId(), saved.getSender().getId(), saved.getSender().getName(),
                saved.getReceiver().getId(), saved.getContent(), saved.getSentAt()
        );

        // Push to the receiver's private queue
        messagingTemplate.convertAndSendToUser(receiver.getEmail(), "/queue/messages", response);

        // Also echo back to the sender, so their own screen updates too
        messagingTemplate.convertAndSendToUser(sender.getEmail(), "/queue/messages", response);
    }

    @MessageExceptionHandler
    @SendToUser("/queue/errors")
    public String handleException(Exception ex) {
        return ex.getMessage();
    }
}
