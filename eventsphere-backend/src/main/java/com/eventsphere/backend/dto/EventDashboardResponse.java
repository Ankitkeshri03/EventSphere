package com.eventsphere.backend.dto;

import java.util.List;

public class EventDashboardResponse {
    private Long eventId;
    private String eventTitle;
    private int totalRegistrations;
    private int totalCheckedIn;
    private List<String> checkedInNames;

    public EventDashboardResponse(Long eventId, String eventTitle, int totalRegistrations,
                                   int totalCheckedIn, List<String> checkedInNames) {
        this.eventId = eventId;
        this.eventTitle = eventTitle;
        this.totalRegistrations = totalRegistrations;
        this.totalCheckedIn = totalCheckedIn;
        this.checkedInNames = checkedInNames;
    }

    public Long getEventId() { return eventId; }
    public String getEventTitle() { return eventTitle; }
    public int getTotalRegistrations() { return totalRegistrations; }
    public int getTotalCheckedIn() { return totalCheckedIn; }
    public List<String> getCheckedInNames() { return checkedInNames; }
}
