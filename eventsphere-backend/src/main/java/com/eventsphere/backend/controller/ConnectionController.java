package com.eventsphere.backend.controller;

import java.util.List;
import java.util.stream.Collectors;

import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.eventsphere.backend.dto.ConnectionResponse;
import com.eventsphere.backend.entity.Connection;
import com.eventsphere.backend.entity.ConnectionStatus;
import com.eventsphere.backend.entity.User;
import com.eventsphere.backend.service.ConnectionService;
import com.eventsphere.backend.service.UserService;

@RestController
@RequestMapping("/connections")
public class ConnectionController {

    private final ConnectionService connectionService;
    private final UserService userService;

    public ConnectionController(ConnectionService connectionService, UserService userService) {
        this.connectionService = connectionService;
        this.userService = userService;
    }

    @PostMapping("/request/{receiverId}")
    public ResponseEntity<ConnectionResponse> sendRequest(@PathVariable Long receiverId,
                                                            Authentication authentication) {
        User sender = userService.getByEmail(authentication.getName());
        Connection connection = connectionService.sendRequest(sender, receiverId);
        return ResponseEntity.ok(toResponse(connection));
    }

    @PostMapping("/{id}/accept")
    public ResponseEntity<ConnectionResponse> accept(@PathVariable Long id, Authentication authentication) {
        User user = userService.getByEmail(authentication.getName());
        Connection connection = connectionService.respondToRequest(id, user.getId(), ConnectionStatus.ACCEPTED);
        return ResponseEntity.ok(toResponse(connection));
    }

    @PostMapping("/{id}/reject")
    public ResponseEntity<ConnectionResponse> reject(@PathVariable Long id, Authentication authentication) {
        User user = userService.getByEmail(authentication.getName());
        Connection connection = connectionService.respondToRequest(id, user.getId(), ConnectionStatus.REJECTED);
        return ResponseEntity.ok(toResponse(connection));
    }

    @GetMapping("/me")
    public ResponseEntity<List<ConnectionResponse>> getMyConnections(Authentication authentication) {
        User user = userService.getByEmail(authentication.getName());
        List<ConnectionResponse> connections = connectionService.getMyConnections(user.getId())
                .stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
        return ResponseEntity.ok(connections);
    }

    private ConnectionResponse toResponse(Connection c) {
        return new ConnectionResponse(
                c.getId(), c.getSender().getId(), c.getSender().getName(),
                c.getReceiver().getId(), c.getReceiver().getName(),
                c.getStatus(), c.getCreatedAt()
        );
    }
}
