package com.ultrabms.repository;

import com.ultrabms.entity.Unit;
import com.ultrabms.entity.enums.UnitStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

/**
 * Repository interface for Unit entity.
 * Provides CRUD operations and custom query methods for unit management.
 */
@Repository
public interface UnitRepository extends JpaRepository<Unit, UUID>, JpaSpecificationExecutor<Unit> {

    /**
     * Find all units belonging to a specific property
     */
    List<Unit> findByPropertyId(UUID propertyId);

    /**
     * Find all units with a specific status
     */
    List<Unit> findByStatus(UnitStatus status);

    /**
     * Find units by property and status with pagination
     */
    Page<Unit> findByPropertyIdAndStatus(UUID propertyId, UnitStatus status, Pageable pageable);

    /**
     * Find a specific unit by property and unit number
     */
    Optional<Unit> findByPropertyIdAndUnitNumber(UUID propertyId, String unitNumber);

    /**
     * Count units by property and status
     */
    long countByPropertyIdAndStatus(UUID propertyId, UnitStatus status);

    /**
     * Count total units in a property
     */
    long countByPropertyId(UUID propertyId);

    /**
     * Find units by bedroom count
     */
    List<Unit> findByBedroomCount(Integer bedroomCount);

    /**
     * Find units by rent range
     */
    @Query("SELECT u FROM Unit u WHERE u.monthlyRent BETWEEN :minRent AND :maxRent")
    List<Unit> findByRentRange(@Param("minRent") BigDecimal minRent, @Param("maxRent") BigDecimal maxRent);

    /**
     * Find available units in a property
     */
    List<Unit> findByPropertyIdAndStatus(UUID propertyId, UnitStatus status);
}
