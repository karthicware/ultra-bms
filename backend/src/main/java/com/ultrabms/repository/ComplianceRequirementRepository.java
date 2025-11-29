package com.ultrabms.repository;

import com.ultrabms.entity.ComplianceRequirement;
import com.ultrabms.entity.enums.ComplianceCategory;
import com.ultrabms.entity.enums.RequirementStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

/**
 * Repository interface for ComplianceRequirement entity.
 * Provides CRUD operations and custom queries for compliance requirement management.
 *
 * Story 7.3: Compliance and Inspection Tracking
 * AC #44: Repositories with custom queries
 */
@Repository
public interface ComplianceRequirementRepository extends JpaRepository<ComplianceRequirement, UUID> {

    // =================================================================
    // FIND BY UNIQUE IDENTIFIERS
    // =================================================================

    /**
     * Find requirement by unique requirement number
     *
     * @param requirementNumber Requirement number (e.g., "CMP-2025-0001")
     * @return Optional requirement
     */
    Optional<ComplianceRequirement> findByRequirementNumber(String requirementNumber);

    /**
     * Find the latest requirement number to generate next sequence
     * Used for auto-generating requirement numbers in format CMP-{YEAR}-{SEQUENCE}
     *
     * @param prefix Requirement number prefix (e.g., "CMP-2025-")
     * @return Optional latest requirement ordered by requirement number desc
     */
    @Query("SELECT cr FROM ComplianceRequirement cr WHERE cr.requirementNumber LIKE CONCAT(:prefix, '%') ORDER BY cr.requirementNumber DESC LIMIT 1")
    Optional<ComplianceRequirement> findTopByRequirementNumberStartingWithOrderByRequirementNumberDesc(@Param("prefix") String prefix);

    // =================================================================
    // LIST QUERIES
    // =================================================================

    /**
     * Find all requirements by status
     *
     * @param status Requirement status
     * @return List of requirements
     */
    List<ComplianceRequirement> findByStatus(RequirementStatus status);

    /**
     * Find all active requirements
     *
     * @return List of active requirements
     */
    default List<ComplianceRequirement> findAllActive() {
        return findByStatus(RequirementStatus.ACTIVE);
    }

    /**
     * Find requirements by category
     *
     * @param category Compliance category
     * @return List of requirements
     */
    List<ComplianceRequirement> findByCategory(ComplianceCategory category);

    /**
     * Find requirements by category and status
     *
     * @param category Compliance category
     * @param status   Requirement status
     * @return List of requirements
     */
    List<ComplianceRequirement> findByCategoryAndStatus(ComplianceCategory category, RequirementStatus status);

    // =================================================================
    // PAGINATED QUERIES
    // =================================================================

    /**
     * Find requirements with filters (paginated)
     *
     * @param category Optional category filter (null = all)
     * @param status   Optional status filter (null = all)
     * @param search   Optional search term for name (null = no search)
     * @param pageable Pagination info
     * @return Page of requirements
     */
    @Query("""
        SELECT cr FROM ComplianceRequirement cr
        WHERE (:category IS NULL OR cr.category = :category)
        AND (:status IS NULL OR cr.status = :status)
        AND (:search IS NULL OR LOWER(cr.requirementName) LIKE LOWER(CONCAT('%', :search, '%')))
        """)
    Page<ComplianceRequirement> findWithFilters(
        @Param("category") ComplianceCategory category,
        @Param("status") RequirementStatus status,
        @Param("search") String search,
        Pageable pageable
    );

    // =================================================================
    // PROPERTY-SPECIFIC QUERIES
    // =================================================================

    /**
     * Find active requirements that apply to a specific property
     * A requirement applies to a property if:
     * - applicableProperties is null (applies to all), OR
     * - applicableProperties contains the property ID
     *
     * @param propertyId Property UUID
     * @return List of applicable requirements
     */
    @Query(value = """
        SELECT cr.* FROM compliance_requirements cr
        WHERE cr.status = 'ACTIVE'
        AND (cr.applicable_properties IS NULL
             OR cr.applicable_properties @> :propertyIdJson::jsonb)
        """, nativeQuery = true)
    List<ComplianceRequirement> findActiveRequirementsForProperty(@Param("propertyIdJson") String propertyIdJson);

    // =================================================================
    // COUNT QUERIES
    // =================================================================

    /**
     * Count requirements by status
     *
     * @param status Requirement status
     * @return Count
     */
    long countByStatus(RequirementStatus status);

    /**
     * Count requirements by category and status
     *
     * @param category Compliance category
     * @param status   Requirement status
     * @return Count
     */
    long countByCategoryAndStatus(ComplianceCategory category, RequirementStatus status);
}
