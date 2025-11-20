package com.ultrabms.service.impl;

import com.ultrabms.dto.properties.CreatePropertyRequest;
import com.ultrabms.dto.properties.OccupancyResponse;
import com.ultrabms.dto.properties.PropertyImageResponse;
import com.ultrabms.dto.properties.PropertyResponse;
import com.ultrabms.dto.properties.UpdatePropertyRequest;
import com.ultrabms.entity.Property;
import com.ultrabms.entity.PropertyImage;
import com.ultrabms.entity.User;
import com.ultrabms.entity.enums.PropertyStatus;
import com.ultrabms.entity.enums.PropertyType;
import com.ultrabms.entity.enums.UnitStatus;
import com.ultrabms.exception.ResourceNotFoundException;
import com.ultrabms.exception.ValidationException;
import com.ultrabms.repository.PropertyImageRepository;
import com.ultrabms.repository.PropertyRepository;
import com.ultrabms.repository.UnitRepository;
import com.ultrabms.repository.UserRepository;
import com.ultrabms.service.FileStorageService;
import com.ultrabms.service.PropertyService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

/**
 * Implementation of PropertyService
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class PropertyServiceImpl implements PropertyService {

    private final PropertyRepository propertyRepository;
    private final PropertyImageRepository propertyImageRepository;
    private final UnitRepository unitRepository;
    private final UserRepository userRepository;
    private final FileStorageService fileStorageService;

    @Override
    @Transactional
    public PropertyResponse createProperty(CreatePropertyRequest request, UUID createdBy) {
        log.info("Creating new property: {}", request.getName());

        // Validate unique property name
        if (propertyRepository.findByName(request.getName()).isPresent()) {
            throw new ValidationException("Property with this name already exists");
        }

        // Fetch manager if provided
        User manager = null;
        if (request.getManagerId() != null) {
            manager = userRepository.findById(request.getManagerId())
                    .orElseThrow(() -> new ResourceNotFoundException("Manager not found with ID: " + request.getManagerId()));
        }

        // Create property entity
        Property property = Property.builder()
                .name(request.getName())
                .address(request.getAddress())
                .propertyType(request.getPropertyType())
                .totalUnitsCount(request.getTotalUnitsCount())
                .manager(manager)
                .yearBuilt(request.getYearBuilt())
                .totalSquareFootage(request.getTotalSquareFootage())
                .amenities(request.getAmenities())
                .status(request.getStatus() != null ? request.getStatus() : PropertyStatus.ACTIVE)
                .createdBy(createdBy)
                .build();

        property = propertyRepository.save(property);
        log.info("Property created successfully: {}", property.getName());
        return PropertyResponse.fromEntity(property);
    }

    @Override
    @Transactional(readOnly = true)
    public PropertyResponse getPropertyById(UUID id) {
        log.info("Fetching property by ID: {}", id);
        Property property = findPropertyById(id);
        return PropertyResponse.fromEntity(property);
    }

    @Override
    @Transactional(readOnly = true)
    public PropertyResponse getPropertyByIdWithOccupancy(UUID id) {
        log.info("Fetching property with occupancy by ID: {}", id);
        Property property = findPropertyById(id);
        return buildPropertyResponseWithOccupancy(property);
    }

    @Override
    @Transactional
    public PropertyResponse updateProperty(UUID id, UpdatePropertyRequest request) {
        log.info("Updating property: {}", id);

        Property property = findPropertyById(id);

        // Update fields if provided
        if (request.getName() != null) {
            // Check uniqueness if changed
            if (!request.getName().equals(property.getName()) &&
                    propertyRepository.findByName(request.getName()).isPresent()) {
                throw new ValidationException("Property with this name already exists");
            }
            property.setName(request.getName());
        }
        if (request.getAddress() != null) {
            property.setAddress(request.getAddress());
        }
        if (request.getPropertyType() != null) {
            property.setPropertyType(request.getPropertyType());
        }
        if (request.getTotalUnitsCount() != null) {
            property.setTotalUnitsCount(request.getTotalUnitsCount());
        }
        if (request.getManagerId() != null) {
            User manager = userRepository.findById(request.getManagerId())
                    .orElseThrow(() -> new ResourceNotFoundException("Manager not found with ID: " + request.getManagerId()));
            property.setManager(manager);
        }
        if (request.getYearBuilt() != null) {
            property.setYearBuilt(request.getYearBuilt());
        }
        if (request.getTotalSquareFootage() != null) {
            property.setTotalSquareFootage(request.getTotalSquareFootage());
        }
        if (request.getAmenities() != null) {
            property.setAmenities(request.getAmenities());
        }
        if (request.getStatus() != null) {
            property.setStatus(request.getStatus());
        }

        property = propertyRepository.save(property);
        log.info("Property updated successfully: {}", property.getName());
        return PropertyResponse.fromEntity(property);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<PropertyResponse> searchProperties(
            PropertyType type,
            PropertyStatus status,
            String search,
            Pageable pageable
    ) {
        log.info("Searching properties with type: {}, status: {}, search: {}", type, status, search);

        Specification<Property> spec = Specification.where(null);

        // Only show active properties by default
        spec = spec.and((root, query, cb) -> cb.equal(root.get("active"), true));

        if (type != null) {
            spec = spec.and((root, query, cb) -> cb.equal(root.get("propertyType"), type));
        }
        if (status != null) {
            spec = spec.and((root, query, cb) -> cb.equal(root.get("status"), status));
        }
        if (search != null && !search.trim().isEmpty()) {
            String searchTerm = "%" + search.toLowerCase() + "%";
            spec = spec.and((root, query, cb) -> cb.or(
                    cb.like(cb.lower(root.get("name")), searchTerm),
                    cb.like(cb.lower(root.get("address")), searchTerm)
            ));
        }

        return propertyRepository.findAll(spec, pageable)
                .map(PropertyResponse::fromEntity);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<PropertyResponse> getAllProperties(Pageable pageable) {
        log.info("Fetching all active properties");
        return propertyRepository.findByStatus(PropertyStatus.ACTIVE, pageable)
                .map(PropertyResponse::fromEntity);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<PropertyResponse> getAllPropertiesWithOccupancy(Pageable pageable) {
        log.info("Fetching all active properties with occupancy data");
        return propertyRepository.findByStatus(PropertyStatus.ACTIVE, pageable)
                .map(this::buildPropertyResponseWithOccupancy);
    }

    @Override
    @Transactional
    public PropertyResponse assignManager(UUID propertyId, UUID managerId) {
        log.info("Assigning manager {} to property {}", managerId, propertyId);

        Property property = findPropertyById(propertyId);
        User manager = userRepository.findById(managerId)
                .orElseThrow(() -> new ResourceNotFoundException("Manager not found with ID: " + managerId));

        property.setManager(manager);
        property = propertyRepository.save(property);

        log.info("Manager assigned successfully to property: {}", property.getName());
        return PropertyResponse.fromEntity(property);
    }

    @Override
    @Transactional
    public PropertyImageResponse uploadImage(
            UUID propertyId,
            MultipartFile file,
            Integer displayOrder,
            UUID uploadedBy
    ) {
        log.info("Uploading image for property: {}", propertyId);

        Property property = findPropertyById(propertyId);

        // Validate file
        if (file.isEmpty()) {
            throw new ValidationException("File is empty");
        }

        // Max file size: 10MB
        long maxSize = 10 * 1024 * 1024;
        if (file.getSize() > maxSize) {
            throw new ValidationException("File size exceeds maximum limit of 10MB");
        }

        // Validate file type
        String contentType = file.getContentType();
        if (contentType == null || !contentType.startsWith("image/")) {
            throw new ValidationException("File must be an image");
        }

        // Store file
        String filePath = fileStorageService.storeFile(
                file,
                String.format("properties/%s/images", propertyId)
        );

        // Get next display order if not provided
        if (displayOrder == null) {
            long imageCount = propertyImageRepository.countByPropertyId(propertyId);
            displayOrder = (int) imageCount;
        }

        // Fetch user who uploaded the image
        User uploader = uploadedBy != null ?
                userRepository.findById(uploadedBy)
                        .orElseThrow(() -> new ResourceNotFoundException("User not found with ID: " + uploadedBy))
                : null;

        // Create image entity
        PropertyImage image = PropertyImage.builder()
                .property(property)
                .fileName(file.getOriginalFilename())
                .filePath(filePath)
                .fileSize(file.getSize())
                .displayOrder(displayOrder)
                .uploadedBy(uploader)
                .build();

        image = propertyImageRepository.save(image);
        log.info("Image uploaded successfully: {}", image.getId());
        return PropertyImageResponse.fromEntity(image);
    }

    @Override
    @Transactional(readOnly = true)
    public List<PropertyImageResponse> getPropertyImages(UUID propertyId) {
        log.info("Fetching images for property: {}", propertyId);
        findPropertyById(propertyId); // Validate property exists
        return propertyImageRepository.findByPropertyIdOrderByDisplayOrderAsc(propertyId)
                .stream()
                .map(PropertyImageResponse::fromEntity)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional
    public void deleteImage(UUID imageId) {
        log.info("Deleting image: {}", imageId);
        PropertyImage image = propertyImageRepository.findById(imageId)
                .orElseThrow(() -> new ResourceNotFoundException("Image not found"));

        fileStorageService.deleteFile(image.getFilePath());
        propertyImageRepository.delete(image);
        log.info("Image deleted successfully: {}", imageId);
    }

    @Override
    @Transactional
    public void reorderImages(UUID propertyId, List<UUID> imageIds) {
        log.info("Reordering images for property: {}", propertyId);
        findPropertyById(propertyId); // Validate property exists

        for (int i = 0; i < imageIds.size(); i++) {
            UUID imageId = imageIds.get(i);
            PropertyImage image = propertyImageRepository.findById(imageId)
                    .orElseThrow(() -> new ResourceNotFoundException("Image not found: " + imageId));

            if (!image.getProperty().getId().equals(propertyId)) {
                throw new ValidationException("Image " + imageId + " does not belong to property " + propertyId);
            }

            image.setDisplayOrder(i);
            propertyImageRepository.save(image);
        }

        log.info("Images reordered successfully for property: {}", propertyId);
    }

    @Override
    @Transactional(readOnly = true)
    public OccupancyResponse getPropertyOccupancy(UUID propertyId) {
        log.info("Fetching occupancy metrics for property: {}", propertyId);
        Property property = findPropertyById(propertyId);

        int total = property.getTotalUnitsCount();
        int available = (int) unitRepository.countByPropertyIdAndStatus(propertyId, UnitStatus.AVAILABLE);
        int occupied = (int) unitRepository.countByPropertyIdAndStatus(propertyId, UnitStatus.OCCUPIED);
        int underMaintenance = (int) unitRepository.countByPropertyIdAndStatus(propertyId, UnitStatus.UNDER_MAINTENANCE);
        int reserved = (int) unitRepository.countByPropertyIdAndStatus(propertyId, UnitStatus.RESERVED);

        return OccupancyResponse.fromCounts(total, available, occupied, underMaintenance, reserved);
    }

    @Override
    @Transactional
    public void deleteProperty(UUID id) {
        log.info("Soft deleting property: {}", id);
        Property property = findPropertyById(id);

        // Validate that all units are available before deleting
        long occupiedUnitsCount = unitRepository.countByPropertyIdAndStatus(id, UnitStatus.OCCUPIED);
        if (occupiedUnitsCount > 0) {
            throw new ValidationException("Cannot delete property with occupied units");
        }

        property.setActive(false);
        propertyRepository.save(property);
        log.info("Property soft deleted successfully: {}", id);
    }

    @Override
    @Transactional
    public PropertyResponse restoreProperty(UUID id) {
        log.info("Restoring property: {}", id);
        Property property = propertyRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Property not found with ID: " + id));

        property.setActive(true);
        property = propertyRepository.save(property);
        log.info("Property restored successfully: {}", id);
        return PropertyResponse.fromEntity(property);
    }

    /**
     * Helper method to find property by ID
     */
    private Property findPropertyById(UUID id) {
        return propertyRepository.findById(id)
                .filter(Property::getActive)
                .orElseThrow(() -> new ResourceNotFoundException("Property not found with ID: " + id));
    }

    /**
     * Helper method to build PropertyResponse with occupancy data
     */
    private PropertyResponse buildPropertyResponseWithOccupancy(Property property) {
        int occupied = (int) unitRepository.countByPropertyIdAndStatus(property.getId(), UnitStatus.OCCUPIED);
        int available = (int) unitRepository.countByPropertyIdAndStatus(property.getId(), UnitStatus.AVAILABLE);
        int underMaintenance = (int) unitRepository.countByPropertyIdAndStatus(property.getId(), UnitStatus.UNDER_MAINTENANCE);
        int reserved = (int) unitRepository.countByPropertyIdAndStatus(property.getId(), UnitStatus.RESERVED);

        return PropertyResponse.fromEntityWithOccupancy(
                property,
                occupied,
                available,
                underMaintenance,
                reserved
        );
    }
}
