package com.eventsphere.backend.service;

import java.time.LocalDateTime;
import java.util.List;

import org.springframework.stereotype.Service;

import com.eventsphere.backend.entity.Connection;
import com.eventsphere.backend.entity.ConnectionStatus;
import com.eventsphere.backend.entity.User;
import com.eventsphere.backend.repository.ConnectionRepository;

@Service
public class ConnectionService {

    private final ConnectionRepository connectionRepository;
    private final UserService userService;

    public ConnectionService(ConnectionRepository connectionRepository, UserService userService) {
        this.connectionRepository = connectionRepository;
        this.userService = userService;
    }

    public Connection sendRequest(User sender, Long receiverId) {
        if (sender.getId().equals(receiverId)) {
            throw new IllegalArgumentException("You cannot connect with yourself");
        }

        User receiver = userService.getById(receiverId);

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

        return connectionRepository.save(connection);
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
