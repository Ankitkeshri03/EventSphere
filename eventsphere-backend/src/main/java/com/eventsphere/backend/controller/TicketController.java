package com.eventsphere.backend.controller;

import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.eventsphere.backend.entity.Ticket;
import com.eventsphere.backend.entity.User;
import com.eventsphere.backend.service.QrCodeService;
import com.eventsphere.backend.service.TicketService;
import com.eventsphere.backend.service.UserService;

@RestController
@RequestMapping("/tickets")
public class TicketController {

    private final TicketService ticketService;
    private final QrCodeService qrCodeService;
    private final UserService userService;

    public TicketController(TicketService ticketService, QrCodeService qrCodeService, UserService userService) {
        this.ticketService = ticketService;
        this.qrCodeService = qrCodeService;
        this.userService = userService;
    }

    @GetMapping(value = "/{qrCode}/image", produces = MediaType.IMAGE_PNG_VALUE)
    public ResponseEntity<byte[]> getQrImage(@PathVariable String qrCode,
                                               Authentication authentication) throws Exception {
        Ticket ticket = ticketService.getByQrCode(qrCode);

        User requester = userService.getByEmail(authentication.getName());
        Long ticketOwnerId = ticket.getRegistration().getUser().getId();

        if (!ticketOwnerId.equals(requester.getId())) {
            throw new SecurityException("You do not have access to this ticket");
        }

        byte[] image = qrCodeService.generateQrImage(ticket.getQrCode());
        return ResponseEntity.ok(image);
    }
}