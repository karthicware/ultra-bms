package com.ultrabms.service;

import com.ultrabms.dto.properties.CreatePropertyRequest;
import com.ultrabms.dto.properties.OccupancyResponse;
import com.ultrabms.dto.properties.PropertyImageResponse;
import com.ultrabms.dto.properties.PropertyResponse;
import com.ultrabms.dto.properties.UpdatePropertyRequest;
import com.ultrabms.entity.enums.PropertyStatus;
import com.ultrabms.entity.enums.PropertyType;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.UUID;

/**
 * Service interface for Property management
 */
public interface PropertyService {

    /**
     * Create a new property
     */
    PropertyResponse createProperty(CreatePropertyRequest request, UUID createdBy);

    /**
     * Get property by ID
     */
    PropertyResponse getPropertyById(UUID id);

    /**
     * Get property by ID with occupancy data
     */
    PropertyResponse getPropertyByIdWithOccupancy(UUID id);

    /**
     * Update existing property
     */
    PropertyResponse updateProperty(UUID id, UpdatePropertyRequest request);

    /**
     * Search properties with filters
     */
    Page<PropertyResponse> searchProperties(
            PropertyType type,
            PropertyStatus status,
            String search,
            Pageable pageable
    );

    /**
     * Get all properties (active only by default)
     */
    Page<PropertyResponse> getAllProperties(Pageable pageable);

    /**
     * Get all properties with occupancy data
     */
    Page<PropertyResponse> getAllPropertiesWithOccupancy(Pageable pageable);

    /**
     * Assign property manager
     */
    PropertyResponse assignManager(UUID propertyId, UUID managerId);

    /**
     * Upload image for property
     */
    PropertyImageResponse uploadImage(
            UUID propertyId,
            MultipartFile file,
            Integer displayOrder,
            UUID uploadedBy
    );

    /**
     * Get all images for a property
     */
    List<PropertyImageResponse> getPropertyImages(UUID propertyId);

    /**
     * Delete image
     */
    void deleteImage(UUID imageId);

    /**
     * Reorder property images
     */
    void reorderImages(UUID propertyId, List<UUID> imageIds);

    /**
     * Get property occupancy metrics
     */
    OccupancyResponse getPropertyOccupancy(UUID propertyId);

    /**
     * Soft delete property (set active = false)
     */
    void deleteProperty(UUID id);

    /**
     * Restore soft deleted property (set active = true)
     */
    PropertyResponse restoreProperty(UUID id);
}
