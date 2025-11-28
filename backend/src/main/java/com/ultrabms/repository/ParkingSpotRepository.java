package com.ultrabms.repository;

import com.ultrabms.entity.ParkingSpot;
import com.ultrabms.entity.enums.ParkingSpotStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

/**
 * Repository interface for ParkingSpot entity.
 * Story 3.8: Parking Spot Inventory Management
 *
 * Provides CRUD operations and custom query methods for parking spot management.
 */
@Repository
public interface ParkingSpotRepository extends JpaRepository<ParkingSpot, UUID>, JpaSpecificationExecutor<ParkingSpot> {

    /**
     * Find active parking spot by ID
     *
     * @param id Parking spot UUID
     * @return Optional containing the parking spot if found and active
     */
    Optional<ParkingSpot> findByIdAndActiveTrue(UUID id);

    /**
     * Find all active parking spots for a property
     *
     * @param propertyId Property UUID
     * @return List of active parking spots
     */
    List<ParkingSpot> findByPropertyIdAndActiveTrue(UUID propertyId);

    /**
     * Find all active parking spots for a property with pagination
     *
     * @param propertyId Property UUID
     * @param pageable Pagination info
     * @return Page of active parking spots
     */
    Page<ParkingSpot> findByPropertyIdAndActiveTrue(UUID propertyId, Pageable pageable);

    /**
     * Find all available parking spots for a property
     * Used for tenant parking allocation dropdown
     *
     * @param propertyId Property UUID
     * @return List of available parking spots
     */
    List<ParkingSpot> findByPropertyIdAndStatusAndActiveTrue(UUID propertyId, ParkingSpotStatus status);

    /**
     * Find all active parking spots by status
     *
     * @param status Parking spot status
     * @return List of active parking spots with given status
     */
    List<ParkingSpot> findByStatusAndActiveTrue(ParkingSpotStatus status);

    /**
     * Find all active parking spots by status with pagination
     *
     * @param status Parking spot status
     * @param pageable Pagination info
     * @return Page of active parking spots
     */
    Page<ParkingSpot> findByStatusAndActiveTrue(ParkingSpotStatus status, Pageable pageable);

    /**
     * Find all active parking spots with pagination
     *
     * @param pageable Pagination info
     * @return Page of active parking spots
     */
    Page<ParkingSpot> findByActiveTrue(Pageable pageable);

    /**
     * Find parking spots by property and status with pagination
     *
     * @param propertyId Property UUID
     * @param status Parking spot status
     * @param pageable Pagination info
     * @return Page of matching parking spots
     */
    Page<ParkingSpot> findByPropertyIdAndStatusAndActiveTrue(
            UUID propertyId,
            ParkingSpotStatus status,
            Pageable pageable);

    /**
     * Check if a spot number already exists in a property (for active spots)
     *
     * @param propertyId Property UUID
     * @param spotNumber Spot number to check
     * @return true if spot number exists
     */
    boolean existsByPropertyIdAndSpotNumberAndActiveTrue(UUID propertyId, String spotNumber);

    /**
     * Check if a spot number already exists in a property excluding a specific spot
     * Used for update validation
     *
     * @param propertyId Property UUID
     * @param spotNumber Spot number to check
     * @param excludeId ID to exclude from check
     * @return true if spot number exists for another spot
     */
    @Query("SELECT COUNT(ps) > 0 FROM ParkingSpot ps " +
           "WHERE ps.property.id = :propertyId " +
           "AND ps.spotNumber = :spotNumber " +
           "AND ps.active = true " +
           "AND ps.id != :excludeId")
    boolean existsByPropertyIdAndSpotNumberAndActiveTrueAndIdNot(
            @Param("propertyId") UUID propertyId,
            @Param("spotNumber") String spotNumber,
            @Param("excludeId") UUID excludeId);

    /**
     * Find all parking spots assigned to a specific tenant
     *
     * @param tenantId Tenant UUID
     * @return List of assigned parking spots
     */
    List<ParkingSpot> findByAssignedTenantIdAndActiveTrue(UUID tenantId);

    /**
     * Search parking spots by spot number or assigned tenant name
     *
     * @param searchTerm Search term
     * @param pageable Pagination info
     * @return Page of matching parking spots
     */
    @Query("SELECT ps FROM ParkingSpot ps " +
           "LEFT JOIN ps.assignedTenant t " +
           "WHERE ps.active = true " +
           "AND (LOWER(ps.spotNumber) LIKE LOWER(CONCAT('%', :searchTerm, '%')) " +
           "OR LOWER(CONCAT(t.firstName, ' ', t.lastName)) LIKE LOWER(CONCAT('%', :searchTerm, '%')))")
    Page<ParkingSpot> searchBySpotNumberOrTenantName(
            @Param("searchTerm") String searchTerm,
            Pageable pageable);

    /**
     * Search parking spots by spot number or tenant name within a property
     *
     * @param propertyId Property UUID
     * @param searchTerm Search term
     * @param pageable Pagination info
     * @return Page of matching parking spots
     */
    @Query("SELECT ps FROM ParkingSpot ps " +
           "LEFT JOIN ps.assignedTenant t " +
           "WHERE ps.active = true " +
           "AND ps.property.id = :propertyId " +
           "AND (LOWER(ps.spotNumber) LIKE LOWER(CONCAT('%', :searchTerm, '%')) " +
           "OR LOWER(CONCAT(t.firstName, ' ', t.lastName)) LIKE LOWER(CONCAT('%', :searchTerm, '%')))")
    Page<ParkingSpot> searchByPropertyAndSpotNumberOrTenantName(
            @Param("propertyId") UUID propertyId,
            @Param("searchTerm") String searchTerm,
            Pageable pageable);

    /**
     * Count parking spots by status
     *
     * @param status Parking spot status
     * @return Count of spots with given status
     */
    long countByStatusAndActiveTrue(ParkingSpotStatus status);

    /**
     * Count parking spots by property and status
     *
     * @param propertyId Property UUID
     * @param status Parking spot status
     * @return Count of spots
     */
    long countByPropertyIdAndStatusAndActiveTrue(UUID propertyId, ParkingSpotStatus status);

    /**
     * Count all active parking spots for a property
     *
     * @param propertyId Property UUID
     * @return Total count of active spots
     */
    long countByPropertyIdAndActiveTrue(UUID propertyId);

    /**
     * Find parking spots by IDs that are not assigned (for bulk delete)
     *
     * @param ids List of parking spot UUIDs
     * @return List of deletable parking spots
     */
    @Query("SELECT ps FROM ParkingSpot ps " +
           "WHERE ps.id IN :ids " +
           "AND ps.active = true " +
           "AND ps.status != 'ASSIGNED'")
    List<ParkingSpot> findDeletableByIds(@Param("ids") List<UUID> ids);

    /**
     * Find all parking spots by IDs (active only)
     *
     * @param ids List of parking spot UUIDs
     * @return List of parking spots
     */
    List<ParkingSpot> findByIdInAndActiveTrue(List<UUID> ids);
}
