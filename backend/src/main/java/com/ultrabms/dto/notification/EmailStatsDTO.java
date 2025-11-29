package com.ultrabms.dto.notification;

import java.time.LocalDateTime;

/**
 * DTO for email statistics.
 *
 * Story 9.1: Email Notification System
 */
public record EmailStatsDTO(
    long pending,
    long queued,
    long sent,
    long failed,
    long total,
    LocalDateTime periodStart,
    LocalDateTime periodEnd
) {
    public EmailStatsDTO(long pending, long queued, long sent, long failed,
                         LocalDateTime periodStart, LocalDateTime periodEnd) {
        this(pending, queued, sent, failed, pending + queued + sent + failed, periodStart, periodEnd);
    }
}
