package com.ultrabms.dto.workorders;

import com.ultrabms.entity.enums.WorkOrderCategory;
import com.ultrabms.entity.enums.WorkOrderPriority;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

/**
 * DTO for creating a new work order
 * Used by property managers/maintenance supervisors
 *
 * Story 4.1: Work Order Creation and Management
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CreateWorkOrderDto {

    /**
     * Property where the maintenance work is required
     */
    @NotNull(message = "Property ID is required")
    private UUID propertyId;

    /**
     * Unit where the maintenance work is required (optional for property-wide work)
     */
    private UUID unitId;

    /**
     * Category of maintenance work
     */
    @NotNull(message = "Category is required")
    private WorkOrderCategory category;

    /**
     * Priority level of the work order
     */
    @NotNull(message = "Priority is required")
    private WorkOrderPriority priority;

    /**
     * Brief title of the work order (1-100 characters)
     */
    @NotBlank(message = "Title is required")
    @Size(min = 1, max = 100, message = "Title must be between 1 and 100 characters")
    private String title;

    /**
     * Detailed description of the work required (1-1000 characters)
     */
    @NotBlank(message = "Description is required")
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
     * Maintenance request that triggered this work order (optional)
     * If provided, links tenant maintenance request to work order
     */
    private UUID maintenanceRequestId;

    /**
     * Asset linked to this work order (optional)
     * Story 7.1: Asset Registry and Tracking - AC #16
     */
    private UUID assetId;

    // Note: Photos are sent separately as MultipartFile[] in controller
    // requestedBy is auto-filled from authenticated user context
}
