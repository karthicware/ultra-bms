package com.ultrabms.dto.compliance;

import com.ultrabms.entity.enums.InspectionResult;
import com.ultrabms.entity.enums.InspectionStatus;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;

/**
 * DTO for updating inspection results
 * Used in PUT /api/v1/inspections/{id}
 *
 * Story 7.3: Compliance and Inspection Tracking
 * AC #20: PUT /api/v1/inspections/{id}
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UpdateInspectionDto {

    /**
     * Actual inspection date
     */
    private LocalDate inspectionDate;

    /**
     * New status
     */
    private InspectionStatus status;

    /**
     * Inspection result
     */
    private InspectionResult result;

    /**
     * Issues found during inspection
     */
    @Size(max = 1000, message = "Issues found must be less than 1000 characters")
    private String issuesFound;

    /**
     * Inspector recommendations
     */
    @Size(max = 1000, message = "Recommendations must be less than 1000 characters")
    private String recommendations;

    /**
     * Next recommended inspection date
     */
    private LocalDate nextInspectionDate;
}
