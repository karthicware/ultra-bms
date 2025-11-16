package com.ultrabms.repository;

import com.ultrabms.entity.PropertyImage;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

/**
 * Repository interface for PropertyImage entity.
 */
@Repository
public interface PropertyImageRepository extends JpaRepository<PropertyImage, UUID> {

    /**
     * Find all images for a property, ordered by display order
     */
    List<PropertyImage> findByPropertyIdOrderByDisplayOrderAsc(UUID propertyId);

    /**
     * Count images for a property
     */
    long countByPropertyId(UUID propertyId);

    /**
     * Delete all images for a property
     */
    void deleteByPropertyId(UUID propertyId);
}
