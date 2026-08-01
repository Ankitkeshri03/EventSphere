package com.eventsphere.backend.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

import com.eventsphere.backend.entity.OrganizerRequest;
import com.eventsphere.backend.entity.OrganizerRequestStatus;

public interface OrganizerRequestRepository extends JpaRepository<OrganizerRequest, Long> {
    List<OrganizerRequest> findByUserIdOrderByCreatedAtDesc(Long userId);
    List<OrganizerRequest> findByStatusOrderByCreatedAtAsc(OrganizerRequestStatus status);
    boolean existsByUserIdAndStatus(Long userId, OrganizerRequestStatus status);
}
