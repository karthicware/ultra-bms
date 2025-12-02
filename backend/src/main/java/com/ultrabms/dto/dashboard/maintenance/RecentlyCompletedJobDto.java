package com.ultrabms.dto.dashboard.maintenance;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.UUID;

/**
 * DTO for Recently Completed Jobs list (AC-9)
 * Contains basic info about last 5 completed jobs
 *
 * Story 8.4: Maintenance Dashboard
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class RecentlyCompletedJobDto {

    /**
     * Work order ID
     */
    private UUID id;

    /**
     * Work order number (e.g., WO-2025-0001)
     */
    private String workOrderNumber;

    /**
     * Work order title
     */
    private String title;

    /**
     * Property name
     */
    private String propertyName;

    /**
     * Date/time when job was completed
     */
    private LocalDateTime completedAt;

    /**
     * Name of person who completed the job (vendor or staff)
     */
    private String completedByName;
}
