package com.ultrabms.repository;

import com.ultrabms.entity.Property;
import com.ultrabms.entity.enums.PropertyType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

/**
 * Repository interface for Property entity.
 * Provides CRUD operations and custom query methods for property management.
 */
@Repository
public interface PropertyRepository extends JpaRepository<Property, UUID> {

    /**
     * Find all properties managed by a specific user.
     * Useful for filtering properties by property manager.
     *
     * @param managerId the UUID of the property manager
     * @return list of properties assigned to the specified manager
     */
    List<Property> findByManagerId(UUID managerId);

    /**
     * Find all properties of a specific type.
     * Useful for filtering by RESIDENTIAL, COMMERCIAL, or MIXED_USE.
     *
     * @param type the property type to filter by
     * @return list of properties matching the specified type
     */
    List<Property> findByType(PropertyType type);

    /**
     * Find a property by its name.
     * Useful for property lookup and validation.
     *
     * @param name the property name to search for
     * @return Optional containing the property if found, empty otherwise
     */
    Optional<Property> findByName(String name);
}
