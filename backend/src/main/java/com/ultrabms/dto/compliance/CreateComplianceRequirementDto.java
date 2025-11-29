package com.ultrabms.dto.compliance;

import com.ultrabms.entity.enums.ComplianceCategory;
import com.ultrabms.entity.enums.ComplianceFrequency;
import com.ultrabms.entity.enums.RequirementStatus;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;
import java.util.UUID;

/**
 * DTO for creating a new compliance requirement
 * Used in POST /api/v1/compliance-requirements
 *
 * Story 7.3: Compliance and Inspection Tracking
 * AC #13: POST /api/v1/compliance-requirements
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CreateComplianceRequirementDto {

    /**
     * Name of the compliance requirement (required, max 200 chars)
     */
    @NotBlank(message = "Requirement name is required")
    @Size(max = 200, message = "Requirement name must be less than 200 characters")
    private String requirementName;

    /**
     * Category of compliance (required)
     */
    @NotNull(message = "Category is required")
    private ComplianceCategory category;

    /**
     * Detailed description (optional, max 1000 chars)
     */
    @Size(max = 1000, message = "Description must be less than 1000 characters")
    private String description;

    /**
     * List of property IDs this requirement applies to
     * null or empty means ALL properties
     */
    private List<UUID> applicableProperties;

    /**
     * How often compliance needs to be met (required)
     */
    @NotNull(message = "Frequency is required")
    private ComplianceFrequency frequency;

    /**
     * Authority or agency that enforces this requirement (optional)
     */
    @Size(max = 200, message = "Authority/Agency must be less than 200 characters")
    private String authorityAgency;

    /**
     * Description of penalties for non-compliance (optional)
     */
    @Size(max = 500, message = "Penalty description must be less than 500 characters")
    private String penaltyDescription;

    /**
     * Active status (defaults to ACTIVE)
     */
    private RequirementStatus status;
}
