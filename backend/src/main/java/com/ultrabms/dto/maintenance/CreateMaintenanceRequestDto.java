package com.ultrabms.dto.maintenance;

import com.ultrabms.entity.enums.MaintenanceCategory;
import com.ultrabms.entity.enums.MaintenancePriority;
import com.ultrabms.entity.enums.PreferredAccessTime;
import jakarta.validation.constraints.FutureOrPresent;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;

/**
 * DTO for creating a new maintenance request
 * Used when tenant submits a maintenance request through the portal
 *
 * Story 3.5: Tenant Portal - Maintenance Request Submission
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CreateMaintenanceRequestDto {

    /**
     * Category of maintenance issue
     */
    @NotNull(message = "Category is required")
    private MaintenanceCategory category;

    /**
     * Priority level (auto-suggested by frontend, can be overridden by tenant)
     */
    @NotNull(message = "Priority is required")
    private MaintenancePriority priority;

    /**
     * Brief title of the issue (1-100 characters)
     */
    @NotBlank(message = "Title is required")
    @Size(min = 1, max = 100, message = "Title must be between 1 and 100 characters")
    private String title;

    /**
     * Detailed description of the issue (20-1000 characters)
     */
    @NotBlank(message = "Description is required")
    @Size(min = 20, max = 1000, message = "Description must be between 20 and 1000 characters")
    private String description;

    /**
     * Tenant's preferred time for vendor access
     */
    @NotNull(message = "Preferred access time is required")
    private PreferredAccessTime preferredAccessTime;

    /**
     * Tenant's preferred date for vendor access (cannot be in the past)
     */
    @NotNull(message = "Preferred access date is required")
    @FutureOrPresent(message = "Preferred access date cannot be in the past")
    private LocalDate preferredAccessDate;

    // Note: Photos are sent separately as MultipartFile[] in controller
    // tenantId, unitId, propertyId are auto-filled from authenticated user context
}
