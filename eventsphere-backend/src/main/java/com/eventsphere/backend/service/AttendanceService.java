package com.eventsphere.backend.service;

import com.eventsphere.backend.entity.Attendance;
import com.eventsphere.backend.entity.Ticket;
import com.eventsphere.backend.repository.AttendanceRepository;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;

@Service
public class AttendanceService {

    private final AttendanceRepository attendanceRepository;
    private final TicketService ticketService;

    public AttendanceService(AttendanceRepository attendanceRepository, TicketService ticketService) {
        this.attendanceRepository = attendanceRepository;
        this.ticketService = ticketService;
    }

    public Attendance checkIn(String qrCode) {
        Ticket ticket = ticketService.getByQrCode(qrCode);

        if (attendanceRepository.existsByTicketId(ticket.getId())) {
            throw new IllegalStateException("This ticket has already been checked in");
        }

        Attendance attendance = new Attendance();
        attendance.setTicket(ticket);
        attendance.setCheckInTime(LocalDateTime.now());

        return attendanceRepository.save(attendance);
    }

    public List<Attendance> getAttendanceForEvent(Long eventId) {
        return attendanceRepository.findByTicket_Registration_Event_Id(eventId);
    }
}
