package com.ultrabms.service;

import com.ultrabms.dto.compliance.ComplianceRequirementDto;
import com.ultrabms.dto.compliance.CreateComplianceRequirementDto;
import com.ultrabms.dto.compliance.UpdateComplianceRequirementDto;
import com.ultrabms.entity.enums.ComplianceCategory;
import com.ultrabms.entity.enums.RequirementStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.util.List;
import java.util.UUID;

/**
 * Service interface for Compliance Requirement operations.
 * Handles CRUD operations for compliance requirements.
 *
 * Story 7.3: Compliance and Inspection Tracking
 * AC #11: POST /api/v1/compliance/requirements
 * AC #12: GET /api/v1/compliance/requirements
 * AC #13: GET /api/v1/compliance/requirements/{id}
 * AC #14: PUT /api/v1/compliance/requirements/{id}
 * AC #15: DELETE /api/v1/compliance/requirements/{id}
 */
public interface ComplianceRequirementService {

    /**
     * Create a new compliance requirement
     *
     * @param dto CreateComplianceRequirementDto with requirement data
     * @return Created requirement DTO
     */
    ComplianceRequirementDto createRequirement(CreateComplianceRequirementDto dto);

    /**
     * Get requirement by ID
     *
     * @param id Requirement UUID
     * @return Requirement DTO
     */
    ComplianceRequirementDto getRequirementById(UUID id);

    /**
     * Get paginated list of requirements with filters
     *
     * @param search Optional search string
     * @param category Optional category filter
     * @param status Optional status filter
     * @param pageable Pagination parameters
     * @return Page of requirement DTOs
     */
    Page<ComplianceRequirementDto> getAllRequirements(
            String search,
            ComplianceCategory category,
            RequirementStatus status,
            Pageable pageable
    );

    /**
     * Update requirement details
     *
     * @param id Requirement UUID
     * @param dto UpdateComplianceRequirementDto with updated data
     * @return Updated requirement DTO
     */
    ComplianceRequirementDto updateRequirement(UUID id, UpdateComplianceRequirementDto dto);

    /**
     * Soft delete requirement
     *
     * @param id Requirement UUID
     * @param deletedBy User UUID who is deleting
     */
    void deleteRequirement(UUID id, UUID deletedBy);

    /**
     * Get active requirements applicable to a property
     *
     * @param propertyId Property UUID
     * @return List of applicable requirement DTOs
     */
    List<ComplianceRequirementDto> getRequirementsForProperty(UUID propertyId);
}
