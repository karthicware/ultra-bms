package com.ultrabms.dto.compliance;

import com.ultrabms.entity.enums.ComplianceCategory;
import com.ultrabms.entity.enums.ComplianceFrequency;
import com.ultrabms.entity.enums.RequirementStatus;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;
import java.util.UUID;

/**
 * DTO for updating a compliance requirement
 * Used in PUT /api/v1/compliance-requirements/{id}
 *
 * Story 7.3: Compliance and Inspection Tracking
 * AC #16: PUT /api/v1/compliance-requirements/{id}
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UpdateComplianceRequirementDto {

    /**
     * Name of the compliance requirement (optional, max 200 chars)
     */
    @Size(max = 200, message = "Requirement name must be less than 200 characters")
    private String requirementName;

    /**
     * Category of compliance (optional)
     */
    private ComplianceCategory category;

    /**
     * Detailed description (optional, max 1000 chars)
     */
    @Size(max = 1000, message = "Description must be less than 1000 characters")
    private String description;

    /**
     * List of property IDs this requirement applies to
     * null = keep existing, empty list = all properties
     */
    private List<UUID> applicableProperties;

    /**
     * How often compliance needs to be met (optional)
     */
    private ComplianceFrequency frequency;

    /**
     * Authority or agency (optional)
     */
    @Size(max = 200, message = "Authority/Agency must be less than 200 characters")
    private String authorityAgency;

    /**
     * Penalty description (optional)
     */
    @Size(max = 500, message = "Penalty description must be less than 500 characters")
    private String penaltyDescription;

    /**
     * Active status (optional)
     */
    private RequirementStatus status;
}
