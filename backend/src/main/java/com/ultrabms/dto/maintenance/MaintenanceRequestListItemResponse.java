package com.ultrabms.dto.maintenance;

import com.ultrabms.entity.enums.MaintenanceCategory;
import com.ultrabms.entity.enums.MaintenancePriority;
import com.ultrabms.entity.enums.MaintenanceStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.UUID;

/**
 * DTO for maintenance request list item (lighter version for list view)
 * Returns essential fields for displaying requests in a paginated list
 *
 * Story 3.5: Tenant Portal - Maintenance Request Submission
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class MaintenanceRequestListItemResponse {

    private UUID id;
    private String requestNumber;
    private String title;
    private MaintenanceCategory category;
    private MaintenancePriority priority;
    private MaintenanceStatus status;
    private LocalDateTime submittedAt;
    private LocalDateTime updatedAt;
}
