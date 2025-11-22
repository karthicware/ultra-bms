package com.ultrabms.repository;

import com.ultrabms.entity.Tenant;
import com.ultrabms.entity.enums.TenantStatus;
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
 * Repository interface for Tenant entity.
 * Provides CRUD operations and custom queries for tenant management.
 */
@Repository
public interface TenantRepository extends JpaRepository<Tenant, UUID> {

    /**
     * Find tenant by ID and active status
     *
     * @param id     Tenant UUID
     * @param active Active flag
     * @return Optional tenant
     */
    Optional<Tenant> findByIdAndActive(UUID id, Boolean active);

    /**
     * Find tenant by email
     *
     * @param email Email address
     * @return Optional tenant
     */
    Optional<Tenant> findByEmail(String email);

    /**
     * Find tenant by user ID
     *
     * @param userId User UUID
     * @return Optional tenant
     */
    Optional<Tenant> findByUserId(UUID userId);

    /**
     * Find tenant by tenant number
     *
     * @param tenantNumber Tenant number (e.g., TNT-2025-0001)
     * @return Optional tenant
     */
    Optional<Tenant> findByTenantNumber(String tenantNumber);

    /**
     * Find all tenants by unit ID
     *
     * @param unitId Unit UUID
     * @return List of tenants
     */
    List<Tenant> findByUnitIdAndActive(UUID unitId, Boolean active);

    /**
     * Find all tenants by property ID
     *
     * @param propertyId Property UUID
     * @param active     Active flag
     * @return List of tenants
     */
    List<Tenant> findByPropertyIdAndActive(UUID propertyId, Boolean active);

    /**
     * Find all active tenants by status
     *
     * @param status   Tenant status
     * @param active   Active flag
     * @param pageable Pagination
     * @return Page of tenants
     */
    Page<Tenant> findByStatusAndActive(TenantStatus status, Boolean active, Pageable pageable);

    /**
     * Find tenants with expiring leases (within specified days)
     *
     * @param currentDate Current date
     * @param expiryDate  Date to check against
     * @param status      Tenant status (ACTIVE)
     * @param active      Active flag
     * @return List of tenants with expiring leases
     */
    @Query("SELECT t FROM Tenant t WHERE t.leaseEndDate BETWEEN :currentDate AND :expiryDate " +
            "AND t.status = :status AND t.active = :active")
    List<Tenant> findExpiringLeases(
            @Param("currentDate") LocalDate currentDate,
            @Param("expiryDate") LocalDate expiryDate,
            @Param("status") TenantStatus status,
            @Param("active") Boolean active);

    /**
     * Check if email already exists
     *
     * @param email Email address
     * @return True if exists
     */
    boolean existsByEmail(String email);

    /**
     * Check if user ID already exists
     *
     * @param userId User UUID
     * @return True if exists
     */
    boolean existsByUserId(UUID userId);

    /**
     * Search tenants by name, email, or tenant number
     *
     * @param searchTerm Search term
     * @param active     Active flag
     * @param pageable   Pagination
     * @return Page of matching tenants
     */
    @Query("SELECT t FROM Tenant t WHERE " +
            "(LOWER(t.firstName) LIKE LOWER(CAST(:searchTerm AS string)) OR " +
            "LOWER(t.lastName) LIKE LOWER(CAST(:searchTerm AS string)) OR " +
            "LOWER(t.email) LIKE LOWER(CAST(:searchTerm AS string)) OR " +
            "LOWER(t.tenantNumber) LIKE LOWER(CAST(:searchTerm AS string))) " +
            "AND t.active = :active")
    Page<Tenant> searchTenants(
            @Param("searchTerm") String searchTerm,
            @Param("active") Boolean active,
            Pageable pageable);

    /**
     * Count all active tenants
     *
     * @param active Active flag
     * @return Count of tenants
     */
    long countByActive(Boolean active);

    /**
     * Count tenants by status
     *
     * @param status Tenant status
     * @param active Active flag
     * @return Count of tenants
     */
    long countByStatusAndActive(TenantStatus status, Boolean active);

    /**
     * Find all tenants created from a specific lead
     *
     * @param leadId Lead UUID
     * @return List of tenants
     */
    List<Tenant> findByLeadId(UUID leadId);

    /**
     * Find all tenants created from a specific quotation
     *
     * @param quotationId Quotation UUID
     * @return List of tenants
     */
    List<Tenant> findByQuotationId(UUID quotationId);
}
