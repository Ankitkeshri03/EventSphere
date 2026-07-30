package com.eventsphere.backend.controller;

import com.eventsphere.backend.dto.AttendanceResponse;
import com.eventsphere.backend.entity.Attendance;
import com.eventsphere.backend.service.AttendanceService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

@RestController
@RequestMapping("/attendance")
public class AttendanceController {

    private final AttendanceService attendanceService;

    public AttendanceController(AttendanceService attendanceService) {
        this.attendanceService = attendanceService;
    }

    @PostMapping("/check-in")
    @PreAuthorize("hasRole('ORGANIZER')")
    public ResponseEntity<AttendanceResponse> checkIn(@RequestBody Map<String, String> body) {
        String qrCode = body.get("qrCode");

        Attendance attendance = attendanceService.checkIn(qrCode);

        AttendanceResponse response = new AttendanceResponse(
                attendance.getId(),
                attendance.getTicket().getQrCode(),
                attendance.getTicket().getRegistration().getUser().getName(),
                attendance.getTicket().getRegistration().getEvent().getTitle(),
                attendance.getCheckInTime()
        );

        return ResponseEntity.ok(response);
    }
}
