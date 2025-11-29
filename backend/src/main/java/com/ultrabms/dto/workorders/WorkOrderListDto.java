package com.ultrabms.dto.workorders;

import com.ultrabms.entity.enums.WorkOrderCategory;
import com.ultrabms.entity.enums.WorkOrderPriority;
import com.ultrabms.entity.enums.WorkOrderStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.UUID;

/**
 * DTO for work order list view (summary)
 * Used in work order list page and GET /api/v1/work-orders
 *
 * Story 4.1: Work Order Creation and Management
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class WorkOrderListDto {

    /**
     * Work order ID
     */
    private UUID id;

    /**
     * Unique work order number (e.g., WO-2025-0001)
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
     * Category of maintenance work
     */
    private WorkOrderCategory category;

    /**
     * Priority level
     */
    private WorkOrderPriority priority;

    /**
     * Current status
     */
    private WorkOrderStatus status;

    /**
     * Scheduled date for the work
     */
    private LocalDateTime scheduledDate;

    /**
     * Assignee's full name (vendor company name or staff name)
     */
    private String assigneeName;

    /**
     * Is this work order overdue?
     * True if scheduled date is in past and status is not COMPLETED or CLOSED
     */
    private Boolean isOverdue;

    /**
     * Asset number (e.g., AST-2025-0001) - Story 7.1
     */
    private String assetNumber;

    /**
     * Asset name - Story 7.1
     */
    private String assetName;

    /**
     * When the work order was created
     */
    private LocalDateTime createdAt;
}
