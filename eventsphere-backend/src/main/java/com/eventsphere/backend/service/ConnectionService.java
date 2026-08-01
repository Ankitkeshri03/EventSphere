package com.eventsphere.backend.service;

import java.time.LocalDateTime;
import java.util.List;

import org.springframework.stereotype.Service;

import com.eventsphere.backend.entity.Connection;
import com.eventsphere.backend.entity.ConnectionStatus;
import com.eventsphere.backend.entity.Role;
import com.eventsphere.backend.entity.User;
import com.eventsphere.backend.repository.ConnectionRepository;

@Service
public class ConnectionService {

    private final ConnectionRepository connectionRepository;
    private final UserService userService;
    private final NotificationService notificationService;

    public ConnectionService(ConnectionRepository connectionRepository, UserService userService,
                              NotificationService notificationService) {
        this.connectionRepository = connectionRepository;
        this.userService = userService;
        this.notificationService = notificationService;
    }

    public Connection sendRequest(User sender, Long receiverId) {
        if (sender.getId().equals(receiverId)) {
            throw new IllegalArgumentException("You cannot connect with yourself");
        }

        if (sender.getRole() == Role.ADMIN) {
            throw new IllegalStateException("Admins cannot send connection requests");
        }

        User receiver = userService.getById(receiverId);

        if (receiver.getRole() == Role.ADMIN) {
            throw new IllegalStateException("You cannot send a connection request to an admin");
        }

        boolean alreadyExists = connectionRepository
                .existsBySenderIdAndReceiverIdOrSenderIdAndReceiverId(
                        sender.getId(), receiverId, receiverId, sender.getId());

        if (alreadyExists) {
            throw new IllegalStateException("A connection already exists with this user");
        }

        Connection connection = new Connection();
        connection.setSender(sender);
        connection.setReceiver(receiver);
        connection.setStatus(ConnectionStatus.PENDING);
        connection.setCreatedAt(LocalDateTime.now());

        Connection saved = connectionRepository.save(connection);

        notificationService.createNotification(
                receiver, "CONNECTION_REQUEST",
                sender.getName() + " sent you a connection request"
        );

        return saved;
    }

    public Connection respondToRequest(Long connectionId, Long requesterId, ConnectionStatus newStatus) {
        Connection connection = connectionRepository.findById(connectionId)
                .orElseThrow(() -> new IllegalArgumentException("Connection request not found"));

        if (!connection.getReceiver().getId().equals(requesterId)) {
            throw new SecurityException("You are not the recipient of this connection request");
        }

        if (connection.getStatus() != ConnectionStatus.PENDING) {
            throw new IllegalStateException("This request has already been responded to");
        }

        connection.setStatus(newStatus);
        return connectionRepository.save(connection);
    }

    public List<Connection> getMyConnections(Long userId) {
        return connectionRepository.findBySenderIdOrReceiverId(userId, userId);
    }
}
