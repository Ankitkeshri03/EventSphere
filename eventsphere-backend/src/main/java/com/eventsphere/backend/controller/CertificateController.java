package com.eventsphere.backend.controller;

import com.eventsphere.backend.entity.Attendance;
import com.eventsphere.backend.repository.AttendanceRepository;
import com.eventsphere.backend.service.CertificateService;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/certificates")
public class CertificateController {

    private final CertificateService certificateService;
    private final AttendanceRepository attendanceRepository;

    public CertificateController(CertificateService certificateService, AttendanceRepository attendanceRepository) {
        this.certificateService = certificateService;
        this.attendanceRepository = attendanceRepository;
    }

    @GetMapping(value = "/{attendanceId}", produces = MediaType.IMAGE_PNG_VALUE)
    public ResponseEntity<byte[]> getCertificate(@PathVariable Long attendanceId, Authentication authentication) throws Exception {
        Attendance attendance = attendanceRepository.findById(attendanceId)
                .orElseThrow(() -> new IllegalArgumentException("Attendance record not found"));

        String ownerEmail = attendance.getTicket().getRegistration().getUser().getEmail();
        if (!ownerEmail.equals(authentication.getName())) {
            throw new SecurityException("This certificate does not belong to you");
        }

        byte[] image = certificateService.generateCertificate(attendance);
        return ResponseEntity.ok(image);
    }
}
