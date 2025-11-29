package com.ultrabms.dto.workorders;

import com.ultrabms.entity.enums.WorkOrderCategory;
import com.ultrabms.entity.enums.WorkOrderPriority;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

/**
 * DTO for updating an existing work order
 * All fields are optional (partial updates supported)
 *
 * Story 4.1: Work Order Creation and Management
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UpdateWorkOrderDto {

    /**
     * Unit where the maintenance work is required (optional)
     */
    private UUID unitId;

    /**
     * Category of maintenance work (optional)
     */
    private WorkOrderCategory category;

    /**
     * Priority level of the work order (optional)
     */
    private WorkOrderPriority priority;

    /**
     * Brief title of the work order (optional, 1-100 characters)
     */
    @Size(min = 1, max = 100, message = "Title must be between 1 and 100 characters")
    private String title;

    /**
     * Detailed description of the work required (optional, 1-1000 characters)
     */
    @Size(min = 1, max = 1000, message = "Description must be between 1 and 1000 characters")
    private String description;

    /**
     * Scheduled date for the work to be performed (optional)
     */
    private LocalDateTime scheduledDate;

    /**
     * Access instructions for vendor/staff (optional, max 500 chars)
     */
    @Size(max = 500, message = "Access instructions must be less than 500 characters")
    private String accessInstructions;

    /**
     * Estimated cost of the work (optional, AED)
     */
    private BigDecimal estimatedCost;

    /**
     * Actual cost of the completed work (optional, AED)
     */
    private BigDecimal actualCost;

    /**
     * Total hours spent on the work (optional)
     */
    private BigDecimal totalHours;

    /**
     * Completion notes (optional, max 2000 chars)
     */
    @Size(max = 2000, message = "Completion notes must be less than 2000 characters")
    private String completionNotes;

    /**
     * Follow-up notes or recommendations (optional, max 1000 chars)
     */
    @Size(max = 1000, message = "Follow-up notes must be less than 1000 characters")
    private String followUpNotes;

    /**
     * Asset linked to this work order (optional)
     * Story 7.1: Asset Registry and Tracking - AC #16
     */
    private UUID assetId;

    // Note: Status updates use separate endpoint (UpdateWorkOrderStatusDto)
    // Assignment updates use separate endpoint (AssignWorkOrderDto)
}
