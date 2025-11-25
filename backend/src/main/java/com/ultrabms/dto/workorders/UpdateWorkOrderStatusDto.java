package com.ultrabms.dto.workorders;

import com.ultrabms.entity.enums.WorkOrderStatus;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * DTO for updating work order status
 * Used in PATCH /api/v1/work-orders/{id}/status
 *
 * Story 4.1: Work Order Creation and Management
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UpdateWorkOrderStatusDto {

    /**
     * New status for the work order
     */
    @NotNull(message = "Status is required")
    private WorkOrderStatus status;

    /**
     * Optional notes explaining the status change (max 500 chars)
     * Example: "Work completed successfully", "Vendor unavailable, reassigning"
     */
    @Size(max = 500, message = "Status change notes must be less than 500 characters")
    private String notes;
}
