package com.eventsphere.backend.service;

import java.time.LocalDateTime;
import java.util.List;

import org.springframework.stereotype.Service;

import com.eventsphere.backend.entity.ConnectionStatus;
import com.eventsphere.backend.entity.Message;
import com.eventsphere.backend.entity.User;
import com.eventsphere.backend.repository.ConnectionRepository;
import com.eventsphere.backend.repository.MessageRepository;

@Service
public class MessageService {

    private final MessageRepository messageRepository;
    private final ConnectionRepository connectionRepository;

    public MessageService(MessageRepository messageRepository, ConnectionRepository connectionRepository) {
        this.messageRepository = messageRepository;
        this.connectionRepository = connectionRepository;
    }

    public Message sendMessage(User sender, User receiver, String content) {
        boolean areConnected = connectionRepository
                .existsBySenderIdAndReceiverIdAndStatusOrSenderIdAndReceiverIdAndStatus(
                        sender.getId(), receiver.getId(), ConnectionStatus.ACCEPTED,
                        receiver.getId(), sender.getId(), ConnectionStatus.ACCEPTED);

        if (!areConnected) {
            throw new IllegalStateException("You must be connected with this user to send messages");
        }

        Message message = new Message();
        message.setSender(sender);
        message.setReceiver(receiver);
        message.setContent(content);
        message.setSentAt(LocalDateTime.now());

        return messageRepository.save(message);
    }

    public List<Message> getConversation(Long userId, Long otherUserId) {
        return messageRepository
                .findBySenderIdAndReceiverIdOrSenderIdAndReceiverIdOrderBySentAtAsc(
                        userId, otherUserId, otherUserId, userId);
    }
}
