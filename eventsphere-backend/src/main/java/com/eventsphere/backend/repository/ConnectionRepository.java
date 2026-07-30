package com.eventsphere.backend.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import com.eventsphere.backend.entity.Connection;
import com.eventsphere.backend.entity.ConnectionStatus;

public interface ConnectionRepository extends JpaRepository<Connection, Long> {

    List<Connection> findBySenderIdOrReceiverId(Long senderId, Long receiverId);

    Optional<Connection> findBySenderIdAndReceiverId(Long senderId, Long receiverId);

    boolean existsBySenderIdAndReceiverIdOrSenderIdAndReceiverId(
            Long senderId1, Long receiverId1, Long senderId2, Long receiverId2);

    boolean existsBySenderIdAndReceiverIdAndStatusOrSenderIdAndReceiverIdAndStatus(
            Long senderId1, Long receiverId1, ConnectionStatus status1,
            Long senderId2, Long receiverId2, ConnectionStatus status2);
}
