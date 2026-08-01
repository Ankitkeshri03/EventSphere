package com.eventsphere.backend.service;

import java.time.LocalDateTime;
import java.util.List;

import org.springframework.stereotype.Service;

import com.eventsphere.backend.entity.OrganizerRequest;
import com.eventsphere.backend.entity.OrganizerRequestStatus;
import com.eventsphere.backend.entity.Role;
import com.eventsphere.backend.entity.User;
import com.eventsphere.backend.repository.OrganizerRequestRepository;

@Service
public class OrganizerRequestService {

    private final OrganizerRequestRepository organizerRequestRepository;
    private final UserService userService;
    private final NotificationService notificationService;

    public OrganizerRequestService(OrganizerRequestRepository organizerRequestRepository, UserService userService,
                                    NotificationService notificationService) {
        this.organizerRequestRepository = organizerRequestRepository;
        this.userService = userService;
        this.notificationService = notificationService;
    }

    public OrganizerRequest submitRequest(User user, String reason) {
        if (user.getRole() != Role.PARTICIPANT) {
            throw new IllegalStateException("Only participants can apply to become an organizer");
        }

        if (organizerRequestRepository.existsByUserIdAndStatus(user.getId(), OrganizerRequestStatus.PENDING)) {
            throw new IllegalStateException("You already have a pending organizer request");
        }

        OrganizerRequest request = new OrganizerRequest();
        request.setUser(user);
        request.setReason(reason);
        request.setStatus(OrganizerRequestStatus.PENDING);
        request.setCreatedAt(LocalDateTime.now());

        return organizerRequestRepository.save(request);
    }

    public List<OrganizerRequest> getMyRequests(Long userId) {
        return organizerRequestRepository.findByUserIdOrderByCreatedAtDesc(userId);
    }

    public List<OrganizerRequest> getPendingRequests() {
        return organizerRequestRepository.findByStatusOrderByCreatedAtAsc(OrganizerRequestStatus.PENDING);
    }

    public OrganizerRequest approve(Long requestId) {
        OrganizerRequest request = getPendingOrThrow(requestId);

        userService.updateRole(request.getUser().getId(), Role.ORGANIZER);
        request.setStatus(OrganizerRequestStatus.APPROVED);
        OrganizerRequest saved = organizerRequestRepository.save(request);

        notificationService.createNotification(
                request.getUser(), "ORGANIZER_REQUEST_APPROVED",
                "Your organizer request was approved — you can now create events"
        );

        return saved;
    }

    public OrganizerRequest reject(Long requestId) {
        OrganizerRequest request = getPendingOrThrow(requestId);

        request.setStatus(OrganizerRequestStatus.REJECTED);
        OrganizerRequest saved = organizerRequestRepository.save(request);

        notificationService.createNotification(
                request.getUser(), "ORGANIZER_REQUEST_REJECTED",
                "Your organizer request was not approved"
        );

        return saved;
    }

    private OrganizerRequest getPendingOrThrow(Long requestId) {
        OrganizerRequest request = organizerRequestRepository.findById(requestId)
                .orElseThrow(() -> new IllegalArgumentException("Organizer request not found"));

        if (request.getStatus() != OrganizerRequestStatus.PENDING) {
            throw new IllegalStateException("This request has already been reviewed");
        }

        return request;
    }
}
