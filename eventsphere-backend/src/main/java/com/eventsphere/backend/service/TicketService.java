package com.eventsphere.backend.service;

import java.time.LocalDateTime;
import java.util.UUID;

import org.springframework.stereotype.Service;

import com.eventsphere.backend.entity.Registration;
import com.eventsphere.backend.entity.Ticket;
import com.eventsphere.backend.repository.TicketRepository;

import lombok.AllArgsConstructor;

@Service
@AllArgsConstructor
public class TicketService {
    

    private final TicketRepository ticketRepository;

    public Ticket issueTicket(Registration registration) {
        Ticket ticket = new Ticket();
        ticket.setRegistration(registration);
        ticket.setQrCode(generateUniqueCode(registration));
        ticket.setIssuedAt(LocalDateTime.now());

        return ticketRepository.save(ticket);
    }
     public Ticket getByQrCode(String qrCode) {
        return ticketRepository.findByQrCode(qrCode)
                .orElseThrow(() -> new IllegalArgumentException("Invalid ticket code"));
    }

    public Ticket getTicketByRegistrationId(Long registrationId) {
        return ticketRepository.findByRegistrationId(registrationId)
                .orElseThrow(() -> new IllegalArgumentException("No ticket found for this registration"));
    }

    // Generate a unique QR code for the ticket based on the registration ID and a random UUID
    private String generateUniqueCode(Registration registration) {
        return "TICKET-" + registration.getId() + "-" + UUID.randomUUID().toString().substring(0, 8);
    }
}
