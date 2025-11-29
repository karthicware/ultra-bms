package com.ultrabms.service.impl;

import com.ultrabms.dto.compliance.ComplianceRequirementDto;
import com.ultrabms.dto.compliance.CreateComplianceRequirementDto;
import com.ultrabms.dto.compliance.UpdateComplianceRequirementDto;
import com.ultrabms.entity.ComplianceRequirement;
import com.ultrabms.entity.enums.ComplianceCategory;
import com.ultrabms.entity.enums.RequirementStatus;
import com.ultrabms.exception.EntityNotFoundException;
import com.ultrabms.repository.ComplianceRequirementRepository;
import com.ultrabms.service.ComplianceRequirementService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

/**
 * Compliance Requirement Service Implementation
 * Handles CRUD operations for compliance requirements
 *
 * Story 7.3: Compliance and Inspection Tracking
 */
@Service
public class ComplianceRequirementServiceImpl implements ComplianceRequirementService {

    private static final Logger LOGGER = LoggerFactory.getLogger(ComplianceRequirementServiceImpl.class);

    private final ComplianceRequirementRepository requirementRepository;

    public ComplianceRequirementServiceImpl(ComplianceRequirementRepository requirementRepository) {
        this.requirementRepository = requirementRepository;
    }

    // =================================================================
    // CREATE REQUIREMENT (AC #11)
    // =================================================================

    @Override
    @Transactional
    public ComplianceRequirementDto createRequirement(CreateComplianceRequirementDto dto) {
        LOGGER.info("Creating compliance requirement: {}", dto.getName());

        ComplianceRequirement requirement = ComplianceRequirement.builder()
                .name(dto.getName())
                .description(dto.getDescription())
                .category(dto.getCategory())
                .frequency(dto.getFrequency())
                .applicableProperties(dto.getApplicableProperties())
                .status(RequirementStatus.ACTIVE)
                .build();

        ComplianceRequirement saved = requirementRepository.save(requirement);
        LOGGER.info("Compliance requirement created: {}", saved.getId());

        return ComplianceRequirementDto.fromEntity(saved);
    }

    // =================================================================
    // GET REQUIREMENT BY ID (AC #13)
    // =================================================================

    @Override
    @Transactional(readOnly = true)
    public ComplianceRequirementDto getRequirementById(UUID id) {
        LOGGER.debug("Getting compliance requirement by ID: {}", id);

        ComplianceRequirement requirement = requirementRepository.findById(id)
                .filter(r -> !r.getIsDeleted())
                .orElseThrow(() -> new EntityNotFoundException("Compliance requirement not found: " + id));

        return ComplianceRequirementDto.fromEntity(requirement);
    }

    // =================================================================
    // GET ALL REQUIREMENTS (AC #12)
    // =================================================================

    @Override
    @Transactional(readOnly = true)
    public Page<ComplianceRequirementDto> getAllRequirements(
            String search,
            ComplianceCategory category,
            RequirementStatus status,
            Pageable pageable
    ) {
        LOGGER.debug("Getting all compliance requirements with filters - search: {}, category: {}, status: {}",
                search, category, status);

        Page<ComplianceRequirement> requirementPage;

        if (hasFilters(search, category, status)) {
            requirementPage = requirementRepository.findWithFilters(search, category, status, pageable);
        } else {
            requirementPage = requirementRepository.findByIsDeletedFalse(pageable);
        }

        List<ComplianceRequirementDto> dtoList = requirementPage.getContent().stream()
                .map(ComplianceRequirementDto::fromEntity)
                .toList();

        return new PageImpl<>(dtoList, pageable, requirementPage.getTotalElements());
    }

    // =================================================================
    // UPDATE REQUIREMENT (AC #14)
    // =================================================================

    @Override
    @Transactional
    public ComplianceRequirementDto updateRequirement(UUID id, UpdateComplianceRequirementDto dto) {
        LOGGER.info("Updating compliance requirement: {}", id);

        ComplianceRequirement requirement = requirementRepository.findById(id)
                .filter(r -> !r.getIsDeleted())
                .orElseThrow(() -> new EntityNotFoundException("Compliance requirement not found: " + id));

        // Update fields if provided
        if (dto.getName() != null) {
            requirement.setName(dto.getName());
        }
        if (dto.getDescription() != null) {
            requirement.setDescription(dto.getDescription());
        }
        if (dto.getCategory() != null) {
            requirement.setCategory(dto.getCategory());
        }
        if (dto.getFrequency() != null) {
            requirement.setFrequency(dto.getFrequency());
        }
        if (dto.getApplicableProperties() != null) {
            requirement.setApplicableProperties(dto.getApplicableProperties());
        }
        if (dto.getStatus() != null) {
            requirement.setStatus(dto.getStatus());
        }

        ComplianceRequirement updated = requirementRepository.save(requirement);
        LOGGER.info("Compliance requirement updated: {}", updated.getId());

        return ComplianceRequirementDto.fromEntity(updated);
    }

    // =================================================================
    // DELETE REQUIREMENT (AC #15)
    // =================================================================

    @Override
    @Transactional
    public void deleteRequirement(UUID id, UUID deletedBy) {
        LOGGER.info("Soft deleting compliance requirement: {} by user: {}", id, deletedBy);

        ComplianceRequirement requirement = requirementRepository.findById(id)
                .filter(r -> !r.getIsDeleted())
                .orElseThrow(() -> new EntityNotFoundException("Compliance requirement not found: " + id));

        requirement.softDelete(deletedBy);
        requirementRepository.save(requirement);

        LOGGER.info("Compliance requirement soft deleted: {}", id);
    }

    // =================================================================
    // GET REQUIREMENTS FOR PROPERTY
    // =================================================================

    @Override
    @Transactional(readOnly = true)
    public List<ComplianceRequirementDto> getRequirementsForProperty(UUID propertyId) {
        LOGGER.debug("Getting compliance requirements for property: {}", propertyId);

        List<ComplianceRequirement> requirements = requirementRepository
                .findActiveRequirementsForProperty(propertyId);

        return requirements.stream()
                .map(ComplianceRequirementDto::fromEntity)
                .toList();
    }

    // =================================================================
    // HELPER METHODS
    // =================================================================

    private boolean hasFilters(String search, ComplianceCategory category, RequirementStatus status) {
        return (search != null && !search.isBlank())
                || category != null
                || status != null;
    }
}
