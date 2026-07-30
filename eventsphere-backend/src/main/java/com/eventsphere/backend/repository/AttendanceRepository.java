package com.eventsphere.backend.repository;

import com.eventsphere.backend.entity.Attendance;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface AttendanceRepository extends JpaRepository<Attendance, Long> {
    Optional<Attendance> findByTicketId(Long ticketId);
    boolean existsByTicketId(Long ticketId);
    List<Attendance> findByTicket_Registration_Event_Id(Long eventId);
}
