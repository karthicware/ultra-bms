package com.ultrabms.repository;

import com.ultrabms.entity.RenewalRequest;
import com.ultrabms.entity.enums.RenewalRequestStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

/**
 * Repository interface for RenewalRequest entity.
 * Provides CRUD operations and custom queries for tenant renewal request management.
 *
 * Story 3.6: Tenant Lease Extension and Renewal
 */
@Repository
public interface RenewalRequestRepository extends JpaRepository<RenewalRequest, UUID> {

    /**
     * Find renewal request by request number
     *
     * @param requestNumber Request number (e.g., REN-2025-0001)
     * @return Optional renewal request
     */
    Optional<RenewalRequest> findByRequestNumber(String requestNumber);

    /**
     * Find all requests for a tenant
     *
     * @param tenantId Tenant UUID
     * @return List of renewal requests ordered by requested date DESC
     */
    List<RenewalRequest> findByTenantIdOrderByRequestedAtDesc(UUID tenantId);

    /**
     * Find all requests for a tenant (paginated)
     *
     * @param tenantId Tenant UUID
     * @param pageable Pagination
     * @return Page of renewal requests
     */
    Page<RenewalRequest> findByTenantId(UUID tenantId, Pageable pageable);

    /**
     * Find requests by status
     *
     * @param status   Request status
     * @param pageable Pagination
     * @return Page of renewal requests
     */
    Page<RenewalRequest> findByStatus(RenewalRequestStatus status, Pageable pageable);

    /**
     * Find pending request for tenant (should be max 1)
     *
     * @param tenantId Tenant UUID
     * @param status   PENDING status
     * @return Optional pending request
     */
    Optional<RenewalRequest> findByTenantIdAndStatus(UUID tenantId, RenewalRequestStatus status);

    /**
     * Check if tenant has pending renewal request
     *
     * @param tenantId Tenant UUID
     * @param status   PENDING status
     * @return True if pending request exists
     */
    boolean existsByTenantIdAndStatus(UUID tenantId, RenewalRequestStatus status);

    /**
     * Find max sequence number for request number generation
     *
     * @param prefix Request number prefix (e.g., "REN-2025-")
     * @return Max sequence number or null if none
     */
    @Query("SELECT MAX(CAST(SUBSTRING(r.requestNumber, 10, 4) AS integer)) FROM RenewalRequest r WHERE r.requestNumber LIKE :prefix%")
    Integer findMaxSequenceForYear(@Param("prefix") String prefix);

    /**
     * Find requests by date range
     *
     * @param startDate Start datetime
     * @param endDate   End datetime
     * @param pageable  Pagination
     * @return Page of renewal requests
     */
    Page<RenewalRequest> findByRequestedAtBetween(LocalDateTime startDate, LocalDateTime endDate, Pageable pageable);

    /**
     * Find requests by status and date range
     *
     * @param status    Request status
     * @param startDate Start datetime
     * @param endDate   End datetime
     * @param pageable  Pagination
     * @return Page of renewal requests
     */
    Page<RenewalRequest> findByStatusAndRequestedAtBetween(
            RenewalRequestStatus status, LocalDateTime startDate, LocalDateTime endDate, Pageable pageable);

    /**
     * Count requests by status
     *
     * @param status Request status
     * @return Count of requests
     */
    long countByStatus(RenewalRequestStatus status);

    /**
     * Count pending requests
     *
     * @return Count of pending requests
     */
    @Query("SELECT COUNT(r) FROM RenewalRequest r WHERE r.status = 'PENDING'")
    long countPendingRequests();

    /**
     * Find all pending requests with tenant details for property manager view
     *
     * @param status   PENDING status
     * @param pageable Pagination
     * @return Page of renewal requests with tenant loaded
     */
    @Query("SELECT r FROM RenewalRequest r JOIN FETCH r.tenant t WHERE r.status = :status ORDER BY r.requestedAt DESC")
    Page<RenewalRequest> findPendingWithTenants(@Param("status") RenewalRequestStatus status, Pageable pageable);

    /**
     * Find requests by property (through tenant's property)
     *
     * @param propertyId Property UUID
     * @param status     Optional status filter
     * @param pageable   Pagination
     * @return Page of renewal requests
     */
    @Query("SELECT r FROM RenewalRequest r WHERE r.tenant.property.id = :propertyId " +
            "AND (:status IS NULL OR r.status = :status)")
    Page<RenewalRequest> findByPropertyIdAndStatus(
            @Param("propertyId") UUID propertyId,
            @Param("status") RenewalRequestStatus status,
            Pageable pageable);
}
