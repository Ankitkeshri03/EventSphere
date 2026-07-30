package com.eventsphere.backend.entity;

import java.time.LocalDateTime;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.OneToOne;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
@Entity
@Table(name = "tickets")
@AllArgsConstructor
@NoArgsConstructor
@Getter
@Setter
public class Ticket {


    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)  
    private Long id;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "registration_id", nullable = false, unique = true)
    private Registration registration;

    @Column(name = "qr_code", nullable = false, unique = true)
    private String qrCode;

    @Column(name = "issued_at", nullable = false, updatable = false)
    private LocalDateTime issuedAt = LocalDateTime.now();
    
    
}
