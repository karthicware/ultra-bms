package com.ultrabms.repository;

import com.ultrabms.entity.LeaseExtension;
import com.ultrabms.entity.enums.LeaseExtensionStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

/**
 * Repository interface for LeaseExtension entity.
 * Provides CRUD operations and custom queries for lease extension management.
 *
 * Story 3.6: Tenant Lease Extension and Renewal
 */
@Repository
public interface LeaseExtensionRepository extends JpaRepository<LeaseExtension, UUID> {

    /**
     * Find lease extension by extension number
     *
     * @param extensionNumber Extension number (e.g., EXT-2025-0001)
     * @return Optional lease extension
     */
    Optional<LeaseExtension> findByExtensionNumber(String extensionNumber);

    /**
     * Find all extensions for a tenant
     *
     * @param tenantId Tenant UUID
     * @return List of lease extensions ordered by created date DESC
     */
    List<LeaseExtension> findByTenantIdOrderByCreatedAtDesc(UUID tenantId);

    /**
     * Find all extensions for a tenant (paginated)
     *
     * @param tenantId Tenant UUID
     * @param pageable Pagination
     * @return Page of lease extensions
     */
    Page<LeaseExtension> findByTenantId(UUID tenantId, Pageable pageable);

    /**
     * Find extensions by status
     *
     * @param status   Extension status
     * @param pageable Pagination
     * @return Page of lease extensions
     */
    Page<LeaseExtension> findByStatus(LeaseExtensionStatus status, Pageable pageable);

    /**
     * Find extensions for tenant by status
     *
     * @param tenantId Tenant UUID
     * @param status   Extension status
     * @return List of lease extensions
     */
    List<LeaseExtension> findByTenantIdAndStatus(UUID tenantId, LeaseExtensionStatus status);

    /**
     * Check if tenant has pending or draft extension
     *
     * @param tenantId  Tenant UUID
     * @param statuses  List of statuses to check
     * @return True if extension exists
     */
    @Query("SELECT COUNT(e) > 0 FROM LeaseExtension e WHERE e.tenant.id = :tenantId AND e.status IN :statuses")
    boolean existsByTenantIdAndStatusIn(@Param("tenantId") UUID tenantId, @Param("statuses") List<LeaseExtensionStatus> statuses);

    /**
     * Find max sequence number for extension number generation
     *
     * @param prefix Extension number prefix (e.g., "EXT-2025-")
     * @return Max sequence number or null if none
     */
    @Query("SELECT MAX(CAST(SUBSTRING(e.extensionNumber, 10, 4) AS integer)) FROM LeaseExtension e WHERE e.extensionNumber LIKE :prefix%")
    Integer findMaxSequenceForYear(@Param("prefix") String prefix);

    /**
     * Find extensions by effective date range
     *
     * @param startDate Start date
     * @param endDate   End date
     * @param pageable  Pagination
     * @return Page of lease extensions
     */
    Page<LeaseExtension> findByEffectiveDateBetween(LocalDate startDate, LocalDate endDate, Pageable pageable);

    /**
     * Count extensions by status
     *
     * @param status Extension status
     * @return Count of extensions
     */
    long countByStatus(LeaseExtensionStatus status);

    /**
     * Count extensions for tenant
     *
     * @param tenantId Tenant UUID
     * @return Count of extensions
     */
    long countByTenantId(UUID tenantId);

    /**
     * Find approved extensions pending application
     *
     * @param status   APPROVED status
     * @param pageable Pagination
     * @return Page of approved but not applied extensions
     */
    @Query("SELECT e FROM LeaseExtension e WHERE e.status = :status AND e.appliedAt IS NULL")
    Page<LeaseExtension> findApprovedPendingApplication(@Param("status") LeaseExtensionStatus status, Pageable pageable);
}
