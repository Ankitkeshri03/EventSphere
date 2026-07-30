package com.eventsphere.backend.dto;

import java.time.LocalDateTime;

import com.eventsphere.backend.entity.ConnectionStatus;

public class ConnectionResponse {
    private Long id;
    private Long senderId;
    private String senderName;
    private Long receiverId;
    private String receiverName;
    private ConnectionStatus status;
    private LocalDateTime createdAt;

    public ConnectionResponse(Long id, Long senderId, String senderName, Long receiverId,
                               String receiverName, ConnectionStatus status, LocalDateTime createdAt) {
        this.id = id;
        this.senderId = senderId;
        this.senderName = senderName;
        this.receiverId = receiverId;
        this.receiverName = receiverName;
        this.status = status;
        this.createdAt = createdAt;
    }

    public Long getId() { return id; }
    public Long getSenderId() { return senderId; }
    public String getSenderName() { return senderName; }
    public Long getReceiverId() { return receiverId; }
    public String getReceiverName() { return receiverName; }
    public ConnectionStatus getStatus() { return status; }
    public LocalDateTime getCreatedAt() { return createdAt; }
}
