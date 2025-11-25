package com.ultrabms.repository;

import com.ultrabms.entity.Property;
import com.ultrabms.entity.enums.PropertyStatus;
import com.ultrabms.entity.enums.PropertyType;
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
 * Repository interface for Property entity.
 * Provides CRUD operations and custom query methods for property management.
 */
@Repository
public interface PropertyRepository extends JpaRepository<Property, UUID>, JpaSpecificationExecutor<Property> {

    /**
     * Find all properties managed by a specific user
     */
    List<Property> findByManagerId(UUID managerId);

    /**
     * Find all properties of a specific type
     */
    List<Property> findByPropertyType(PropertyType type);

    /**
     * Find all active properties
     */
    List<Property> findByStatus(PropertyStatus status);

    /**
     * Find all active properties with pagination
     */
    Page<Property> findByStatus(PropertyStatus status, Pageable pageable);

    /**
     * Find a property by its name
     */
    Optional<Property> findByName(String name);

    /**
     * Search properties by name or address (case-insensitive)
     */
    @Query("SELECT p FROM Property p WHERE " +
            "LOWER(p.name) LIKE LOWER(CAST(:searchTerm AS string)) OR " +
            "LOWER(p.address) LIKE LOWER(CAST(:searchTerm AS string))")
    Page<Property> searchProperties(@Param("searchTerm") String searchTerm, Pageable pageable);

    /**
     * Find properties by type and status
     */
    Page<Property> findByPropertyTypeAndStatus(PropertyType type, PropertyStatus status, Pageable pageable);

    /**
     * Find all active (non-deleted) properties
     * Story 4.2: Preventive Maintenance Scheduling - for PM schedules that apply to all properties
     */
    List<Property> findByActiveTrue();

    /**
     * Find all active properties with ACTIVE status
     * Story 4.2: Preventive Maintenance Scheduling
     */
    List<Property> findByActiveTrueAndStatus(PropertyStatus status);
}
