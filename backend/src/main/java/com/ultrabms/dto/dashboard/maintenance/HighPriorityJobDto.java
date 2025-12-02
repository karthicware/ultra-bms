package com.ultrabms.dto.dashboard.maintenance;

import com.ultrabms.entity.enums.WorkOrderPriority;
import com.ultrabms.entity.enums.WorkOrderStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.UUID;

/**
 * DTO for High Priority & Overdue Jobs table (AC-8)
 * Contains job details for display in the priority/overdue list
 *
 * Story 8.4: Maintenance Dashboard
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class HighPriorityJobDto {

    /**
     * Work order ID
     */
    private UUID id;

    /**
     * Work order number (e.g., WO-2025-0001)
     */
    private String workOrderNumber;

    /**
     * Property name
     */
    private String propertyName;

    /**
     * Unit number (nullable for property-wide work)
     */
    private String unitNumber;

    /**
     * Work order title
     */
    private String title;

    /**
     * Priority level
     */
    private WorkOrderPriority priority;

    /**
     * Current status
     */
    private WorkOrderStatus status;

    /**
     * Assigned vendor or staff name (null if unassigned)
     */
    private String assignedToName;

    /**
     * Scheduled date
     */
    private LocalDateTime scheduledDate;

    /**
     * Days overdue (negative if not yet due, 0 if due today, positive if overdue)
     */
    private Integer daysOverdue;

    /**
     * Whether this job is overdue
     */
    private Boolean isOverdue;
}
