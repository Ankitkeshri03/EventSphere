package com.eventsphere.backend.repository;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import com.eventsphere.backend.entity.Ticket;

public interface  TicketRepository  extends JpaRepository<Ticket, Long> {
    Optional<Ticket> findByQrCode(String qrCode);
    Optional<Ticket> findByRegistrationId(Long registrationId);
}
