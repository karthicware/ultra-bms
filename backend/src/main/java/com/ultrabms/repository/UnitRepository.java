package com.ultrabms.repository;

import com.ultrabms.entity.Unit;
import com.ultrabms.entity.enums.UnitStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

/**
 * Repository interface for Unit entity.
 * Provides CRUD operations and custom query methods for unit management.
 */
@Repository
public interface UnitRepository extends JpaRepository<Unit, UUID> {

    /**
     * Find all units belonging to a specific property.
     * Useful for displaying all units within a property.
     *
     * @param propertyId the UUID of the property
     * @return list of units belonging to the specified property
     */
    List<Unit> findByPropertyId(UUID propertyId);

    /**
     * Find all units with a specific status.
     * Useful for filtering by AVAILABLE, OCCUPIED, or UNDER_MAINTENANCE.
     *
     * @param status the unit status to filter by
     * @return list of units with the specified status
     */
    List<Unit> findByStatus(UnitStatus status);

    /**
     * Find a specific unit by property and unit number.
     * Useful for unit lookup within a property (enforces unique constraint).
     *
     * @param propertyId the UUID of the property
     * @param unitNumber the unit number to search for
     * @return Optional containing the unit if found, empty otherwise
     */
    Optional<Unit> findByPropertyIdAndUnitNumber(UUID propertyId, String unitNumber);

    /**
     * Count units by property and status.
     * Useful for occupancy statistics and availability tracking.
     *
     * @param propertyId the UUID of the property
     * @param status the unit status to count
     * @return number of units matching the criteria
     */
    long countByPropertyIdAndStatus(UUID propertyId, UnitStatus status);
}
