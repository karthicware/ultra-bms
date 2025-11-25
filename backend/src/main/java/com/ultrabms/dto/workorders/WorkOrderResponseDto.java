package com.ultrabms.dto.workorders;

import com.ultrabms.entity.enums.WorkOrderCategory;
import com.ultrabms.entity.enums.WorkOrderPriority;
import com.ultrabms.entity.enums.WorkOrderStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

/**
 * DTO for returning complete work order details
 * Used in work order detail page and GET /api/v1/work-orders/{id}
 *
 * Story 4.1: Work Order Creation and Management
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class WorkOrderResponseDto {

    /**
     * Work order ID
     */
    private UUID id;

    /**
     * Unique work order number (e.g., WO-2025-0001)
     */
    private String workOrderNumber;

    /**
     * Property ID
     */
    private UUID propertyId;

    /**
     * Property name (joined from Property entity)
     */
    private String propertyName;

    /**
     * Unit ID (nullable for property-wide work)
     */
    private UUID unitId;

    /**
     * Unit number (e.g., "101", "A-204")
     */
    private String unitNumber;

    /**
     * User who requested/created the work order
     */
    private UUID requestedBy;

    /**
     * Requester's full name
     */
    private String requesterName;

    /**
     * Vendor or staff member assigned to handle the work order
     */
    private UUID assignedTo;

    /**
     * Assignee's full name (vendor company name or staff name)
     */
    private String assigneeName;

    /**
     * Maintenance request that triggered this work order (nullable)
     */
    private UUID maintenanceRequestId;

    /**
     * Maintenance request number (e.g., MR-2025-0001)
     */
    private String maintenanceRequestNumber;

    /**
     * Category of maintenance work
     */
    private WorkOrderCategory category;

    /**
     * Priority level
     */
    private WorkOrderPriority priority;

    /**
     * Work order title
     */
    private String title;

    /**
     * Work order description
     */
    private String description;

    /**
     * Current status
     */
    private WorkOrderStatus status;

    /**
     * Scheduled date for the work
     */
    private LocalDateTime scheduledDate;

    /**
     * Access instructions for vendor/staff
     */
    private String accessInstructions;

    /**
     * When the work order was assigned
     */
    private LocalDateTime assignedAt;

    /**
     * When work started
     */
    private LocalDateTime startedAt;

    /**
     * When work was completed
     */
    private LocalDateTime completedAt;

    /**
     * When work order was closed
     */
    private LocalDateTime closedAt;

    /**
     * Estimated cost (AED) - Visible only to managers/supervisors
     */
    private BigDecimal estimatedCost;

    /**
     * Actual cost (AED) - Visible only to managers/supervisors
     */
    private BigDecimal actualCost;

    /**
     * Total hours spent
     */
    private BigDecimal totalHours;

    /**
     * Attachment file URLs (max 5 photos)
     */
    private List<String> attachments;

    /**
     * Completion photo URLs
     */
    private List<String> completionPhotos;

    /**
     * Completion notes from vendor/staff
     */
    private String completionNotes;

    /**
     * Follow-up notes or recommendations (deprecated - use recommendations)
     */
    private String followUpNotes;

    // =================================================================
    // Story 4.4: Job Progress Tracking and Completion
    // =================================================================

    /**
     * Recommendations from vendor after completing work
     */
    private String recommendations;

    /**
     * Flag indicating if follow-up work is required
     */
    private Boolean followUpRequired;

    /**
     * Description of required follow-up work
     */
    private String followUpDescription;

    /**
     * Before photo URLs uploaded when starting work
     */
    private List<String> beforePhotos;

    /**
     * After photo URLs uploaded on completion
     */
    private List<String> afterPhotos;

    /**
     * Number of progress updates submitted
     */
    private Integer progressUpdateCount;

    /**
     * When the work order was created
     */
    private LocalDateTime createdAt;

    /**
     * When the work order was last updated
     */
    private LocalDateTime updatedAt;

    /**
     * Version for optimistic locking
     */
    private Long version;
}
