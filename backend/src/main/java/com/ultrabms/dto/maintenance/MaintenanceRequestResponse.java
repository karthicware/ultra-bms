package com.ultrabms.dto.maintenance;

import com.ultrabms.entity.enums.MaintenanceCategory;
import com.ultrabms.entity.enums.MaintenancePriority;
import com.ultrabms.entity.enums.MaintenanceStatus;
import com.ultrabms.entity.enums.PreferredAccessTime;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

/**
 * DTO for maintenance request response
 * Returns complete request details including vendor information if assigned
 *
 * Story 3.5: Tenant Portal - Maintenance Request Submission
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class MaintenanceRequestResponse {

    // Identification
    private UUID id;
    private String requestNumber;

    // Relationships
    private UUID tenantId;
    private UUID unitId;
    private UUID propertyId;
    private UUID assignedTo;

    // Request details
    private MaintenanceCategory category;
    private MaintenancePriority priority;
    private String title;
    private String description;
    private MaintenanceStatus status;

    // Access preferences
    private PreferredAccessTime preferredAccessTime;
    private LocalDate preferredAccessDate;

    // Timestamps
    private LocalDateTime submittedAt;
    private LocalDateTime assignedAt;
    private LocalDateTime startedAt;
    private LocalDateTime completedAt;
    private LocalDateTime closedAt;
    private LocalDate estimatedCompletionDate;

    // Attachments and work details
    private List<String> attachments;
    private String workNotes;
    private List<String> completionPhotos;

    // Tenant feedback
    private Integer rating;
    private String feedback;
    private LocalDateTime feedbackSubmittedAt;

    // Vendor information (populated if request is assigned)
    private String assignedVendorName;
    private String assignedVendorContact;

    // Audit fields
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
