package com.ultrabms.dto.compliance;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.util.UUID;

/**
 * DTO for scheduling a new inspection
 * Used in POST /api/v1/inspections
 *
 * Story 7.3: Compliance and Inspection Tracking
 * AC #19: POST /api/v1/inspections
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CreateInspectionDto {

    /**
     * Compliance schedule ID (required)
     */
    @NotNull(message = "Compliance schedule ID is required")
    private UUID complianceScheduleId;

    /**
     * Property ID (required)
     */
    @NotNull(message = "Property ID is required")
    private UUID propertyId;

    /**
     * Inspector name (required)
     */
    @NotBlank(message = "Inspector name is required")
    @Size(max = 200, message = "Inspector name must be less than 200 characters")
    private String inspectorName;

    /**
     * Scheduled date for inspection (required)
     */
    @NotNull(message = "Scheduled date is required")
    private LocalDate scheduledDate;

    /**
     * Inspector company (optional)
     */
    @Size(max = 200, message = "Inspector company must be less than 200 characters")
    private String inspectorCompany;

    /**
     * Inspector contact info (optional)
     */
    @Size(max = 200, message = "Inspector contact must be less than 200 characters")
    private String inspectorContact;

    /**
     * General notes about the inspection (optional)
     */
    @Size(max = 1000, message = "Notes must be less than 1000 characters")
    private String notes;
}
