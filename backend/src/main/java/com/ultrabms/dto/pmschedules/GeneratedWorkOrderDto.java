package com.ultrabms.dto.pmschedules;

import com.ultrabms.entity.enums.WorkOrderStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.UUID;

/**
 * DTO for generated work order history.
 * Used in PM schedule history view.
 *
 * Story 4.2: Preventive Maintenance Scheduling
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class GeneratedWorkOrderDto {

    /**
     * Work order ID
     */
    private UUID id;

    /**
     * Work order number (e.g., WO-2025-0001)
     */
    private String workOrderNumber;

    /**
     * Date when the work order was generated
     */
    private LocalDate generatedDate;

    /**
     * Scheduled date for the work
     */
    private LocalDateTime scheduledDate;

    /**
     * Current status of the work order
     */
    private WorkOrderStatus status;

    /**
     * When the work order was completed (null if not completed)
     */
    private LocalDateTime completedAt;

    /**
     * Number of days to complete (null if not completed)
     */
    private Integer daysToComplete;

    /**
     * Whether the work order is overdue
     */
    private boolean isOverdue;
}
