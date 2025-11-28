package com.ultrabms.service.impl;

import com.ultrabms.dto.parking.BulkDeleteRequest;
import com.ultrabms.dto.parking.BulkOperationResponse;
import com.ultrabms.dto.parking.BulkStatusChangeRequest;
import com.ultrabms.dto.parking.ChangeStatusRequest;
import com.ultrabms.dto.parking.CreateParkingSpotRequest;
import com.ultrabms.dto.parking.ParkingSpotCountsResponse;
import com.ultrabms.dto.parking.ParkingSpotResponse;
import com.ultrabms.dto.parking.UpdateParkingSpotRequest;
import com.ultrabms.entity.ParkingSpot;
import com.ultrabms.entity.Property;
import com.ultrabms.entity.Tenant;
import com.ultrabms.entity.enums.ParkingSpotStatus;
import com.ultrabms.exception.ConflictException;
import com.ultrabms.exception.ResourceNotFoundException;
import com.ultrabms.exception.ValidationException;
import com.ultrabms.repository.ParkingSpotRepository;
import com.ultrabms.repository.PropertyRepository;
import com.ultrabms.repository.TenantRepository;
import com.ultrabms.service.ParkingSpotService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

/**
 * Implementation of ParkingSpotService
 * Story 3.8: Parking Spot Inventory Management
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class ParkingSpotServiceImpl implements ParkingSpotService {

    private final ParkingSpotRepository parkingSpotRepository;
    private final PropertyRepository propertyRepository;
    private final TenantRepository tenantRepository;

    @Override
    @Transactional
    public ParkingSpotResponse createParkingSpot(CreateParkingSpotRequest request) {
        log.info("Creating new parking spot: {} for property: {}", request.getSpotNumber(), request.getPropertyId());

        // Validate property exists
        Property property = propertyRepository.findById(request.getPropertyId())
                .orElseThrow(() -> new ResourceNotFoundException("Property not found with ID: " + request.getPropertyId()));

        // Check for duplicate spot number in property
        if (parkingSpotRepository.existsByPropertyIdAndSpotNumberAndActiveTrue(
                request.getPropertyId(), request.getSpotNumber())) {
            throw new ConflictException("A parking spot with number '" + request.getSpotNumber() +
                    "' already exists in this building");
        }

        // Create parking spot entity
        ParkingSpot parkingSpot = ParkingSpot.builder()
                .spotNumber(request.getSpotNumber().trim())
                .property(property)
                .defaultFee(request.getDefaultFee())
                .status(ParkingSpotStatus.AVAILABLE)
                .notes(request.getNotes())
                .active(true)
                .build();

        parkingSpot = parkingSpotRepository.save(parkingSpot);
        log.info("Parking spot created successfully: {} (ID: {})", parkingSpot.getSpotNumber(), parkingSpot.getId());

        return ParkingSpotResponse.fromEntity(parkingSpot);
    }

    @Override
    @Transactional(readOnly = true)
    public ParkingSpotResponse getParkingSpotById(UUID id) {
        log.debug("Fetching parking spot by ID: {}", id);
        ParkingSpot parkingSpot = findParkingSpotById(id);
        return ParkingSpotResponse.fromEntity(parkingSpot);
    }

    @Override
    @Transactional
    public ParkingSpotResponse updateParkingSpot(UUID id, UpdateParkingSpotRequest request) {
        log.info("Updating parking spot: {}", id);

        ParkingSpot parkingSpot = findParkingSpotById(id);

        // Update spot number if provided
        if (request.getSpotNumber() != null && !request.getSpotNumber().isBlank()) {
            String newSpotNumber = request.getSpotNumber().trim();
            UUID propertyId = request.getPropertyId() != null ?
                    request.getPropertyId() : parkingSpot.getProperty().getId();

            // Check for duplicate if spot number changed
            if (!newSpotNumber.equals(parkingSpot.getSpotNumber()) &&
                    parkingSpotRepository.existsByPropertyIdAndSpotNumberAndActiveTrueAndIdNot(
                            propertyId, newSpotNumber, id)) {
                throw new ConflictException("A parking spot with number '" + newSpotNumber +
                        "' already exists in this building");
            }
            parkingSpot.setSpotNumber(newSpotNumber);
        }

        // Update property if provided (only if not ASSIGNED)
        if (request.getPropertyId() != null && !request.getPropertyId().equals(parkingSpot.getProperty().getId())) {
            if (parkingSpot.isAssigned()) {
                throw new ValidationException("Cannot change building for an assigned parking spot");
            }
            Property newProperty = propertyRepository.findById(request.getPropertyId())
                    .orElseThrow(() -> new ResourceNotFoundException("Property not found with ID: " + request.getPropertyId()));
            parkingSpot.setProperty(newProperty);
        }

        // Update fee if provided
        if (request.getDefaultFee() != null) {
            parkingSpot.setDefaultFee(request.getDefaultFee());
        }

        // Update notes if provided
        if (request.getNotes() != null) {
            parkingSpot.setNotes(request.getNotes());
        }

        parkingSpot = parkingSpotRepository.save(parkingSpot);
        log.info("Parking spot updated successfully: {}", id);

        return ParkingSpotResponse.fromEntity(parkingSpot);
    }

    @Override
    @Transactional
    public void deleteParkingSpot(UUID id) {
        log.info("Deleting parking spot: {}", id);

        ParkingSpot parkingSpot = findParkingSpotById(id);

        // Cannot delete if ASSIGNED
        if (!parkingSpot.canBeDeleted()) {
            throw new ValidationException("Cannot delete an assigned parking spot. " +
                    "Unassign the tenant first through the checkout process.");
        }

        // Soft delete
        parkingSpot.setActive(false);
        parkingSpotRepository.save(parkingSpot);
        log.info("Parking spot soft deleted: {}", id);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<ParkingSpotResponse> searchParkingSpots(
            UUID propertyId,
            ParkingSpotStatus status,
            String search,
            Pageable pageable) {

        log.debug("Searching parking spots - propertyId: {}, status: {}, search: {}", propertyId, status, search);

        Specification<ParkingSpot> spec = Specification.where(isActive());

        if (propertyId != null) {
            spec = spec.and(hasPropertyId(propertyId));
        }

        if (status != null) {
            spec = spec.and(hasStatus(status));
        }

        if (search != null && !search.isBlank()) {
            spec = spec.and(searchBySpotNumberOrTenantName(search.trim()));
        }

        Page<ParkingSpot> parkingSpots = parkingSpotRepository.findAll(spec, pageable);
        return parkingSpots.map(ParkingSpotResponse::fromEntity);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<ParkingSpotResponse> getAllParkingSpots(Pageable pageable) {
        log.debug("Fetching all parking spots");
        Page<ParkingSpot> parkingSpots = parkingSpotRepository.findByActiveTrue(pageable);
        return parkingSpots.map(ParkingSpotResponse::fromEntity);
    }

    @Override
    @Transactional
    public ParkingSpotResponse changeStatus(UUID id, ChangeStatusRequest request) {
        log.info("Changing status for parking spot: {} to {}", id, request.getStatus());

        ParkingSpot parkingSpot = findParkingSpotById(id);

        // Cannot change status of ASSIGNED spot
        if (!parkingSpot.canChangeStatus()) {
            throw new ValidationException("Cannot change status of an assigned parking spot. " +
                    "Status changes for assigned spots are managed through tenant allocation.");
        }

        // Validate status transition
        if (request.getStatus() == ParkingSpotStatus.ASSIGNED) {
            throw new ValidationException("Cannot manually set status to ASSIGNED. " +
                    "Use tenant allocation flow instead.");
        }

        parkingSpot.setStatus(request.getStatus());
        parkingSpot = parkingSpotRepository.save(parkingSpot);
        log.info("Parking spot status changed to: {}", request.getStatus());

        return ParkingSpotResponse.fromEntity(parkingSpot);
    }

    @Override
    @Transactional
    public BulkOperationResponse bulkDelete(BulkDeleteRequest request) {
        log.info("Bulk deleting {} parking spots", request.getIds().size());

        List<ParkingSpot> spots = parkingSpotRepository.findByIdInAndActiveTrue(request.getIds());
        List<UUID> failedIds = new ArrayList<>();
        int successCount = 0;

        for (ParkingSpot spot : spots) {
            if (spot.canBeDeleted()) {
                spot.setActive(false);
                parkingSpotRepository.save(spot);
                successCount++;
            } else {
                failedIds.add(spot.getId());
            }
        }

        // Add IDs not found to failed list
        for (UUID id : request.getIds()) {
            if (spots.stream().noneMatch(s -> s.getId().equals(id)) && !failedIds.contains(id)) {
                failedIds.add(id);
            }
        }

        String message = failedIds.isEmpty() ?
                String.format("Successfully deleted %d parking spot(s)", successCount) :
                String.format("Deleted %d parking spot(s). %d skipped (assigned or not found)",
                        successCount, failedIds.size());

        log.info("Bulk delete completed: {} success, {} failed", successCount, failedIds.size());
        return BulkOperationResponse.partial(successCount, failedIds, message);
    }

    @Override
    @Transactional
    public BulkOperationResponse bulkChangeStatus(BulkStatusChangeRequest request) {
        log.info("Bulk changing status for {} parking spots to {}", request.getIds().size(), request.getStatus());

        // Validate target status
        if (request.getStatus() == ParkingSpotStatus.ASSIGNED) {
            throw new ValidationException("Cannot manually set status to ASSIGNED. " +
                    "Use tenant allocation flow instead.");
        }

        List<ParkingSpot> spots = parkingSpotRepository.findByIdInAndActiveTrue(request.getIds());
        List<UUID> failedIds = new ArrayList<>();
        int successCount = 0;

        for (ParkingSpot spot : spots) {
            if (spot.canChangeStatus()) {
                spot.setStatus(request.getStatus());
                parkingSpotRepository.save(spot);
                successCount++;
            } else {
                failedIds.add(spot.getId());
            }
        }

        // Add IDs not found to failed list
        for (UUID id : request.getIds()) {
            if (spots.stream().noneMatch(s -> s.getId().equals(id)) && !failedIds.contains(id)) {
                failedIds.add(id);
            }
        }

        String message = failedIds.isEmpty() ?
                String.format("Successfully changed status for %d parking spot(s)", successCount) :
                String.format("Changed status for %d parking spot(s). %d skipped (assigned or not found)",
                        successCount, failedIds.size());

        log.info("Bulk status change completed: {} success, {} failed", successCount, failedIds.size());
        return BulkOperationResponse.partial(successCount, failedIds, message);
    }

    @Override
    @Transactional(readOnly = true)
    public List<ParkingSpotResponse> getAvailableParkingSpots(UUID propertyId) {
        log.debug("Fetching available parking spots for property: {}", propertyId);

        // Validate property exists
        if (!propertyRepository.existsById(propertyId)) {
            throw new ResourceNotFoundException("Property not found with ID: " + propertyId);
        }

        List<ParkingSpot> availableSpots = parkingSpotRepository.findByPropertyIdAndStatusAndActiveTrue(
                propertyId, ParkingSpotStatus.AVAILABLE);

        return availableSpots.stream()
                .map(ParkingSpotResponse::fromEntity)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public Page<ParkingSpotResponse> getParkingSpotsByProperty(UUID propertyId, Pageable pageable) {
        log.debug("Fetching parking spots for property: {}", propertyId);

        // Validate property exists
        if (!propertyRepository.existsById(propertyId)) {
            throw new ResourceNotFoundException("Property not found with ID: " + propertyId);
        }

        Page<ParkingSpot> parkingSpots = parkingSpotRepository.findByPropertyIdAndActiveTrue(propertyId, pageable);
        return parkingSpots.map(ParkingSpotResponse::fromEntity);
    }

    @Override
    @Transactional(readOnly = true)
    public ParkingSpotCountsResponse getParkingSpotCounts(UUID propertyId) {
        log.debug("Fetching parking spot counts for property: {}", propertyId);

        long available, assigned, underMaintenance;

        if (propertyId != null) {
            available = parkingSpotRepository.countByPropertyIdAndStatusAndActiveTrue(
                    propertyId, ParkingSpotStatus.AVAILABLE);
            assigned = parkingSpotRepository.countByPropertyIdAndStatusAndActiveTrue(
                    propertyId, ParkingSpotStatus.ASSIGNED);
            underMaintenance = parkingSpotRepository.countByPropertyIdAndStatusAndActiveTrue(
                    propertyId, ParkingSpotStatus.UNDER_MAINTENANCE);
        } else {
            available = parkingSpotRepository.countByStatusAndActiveTrue(ParkingSpotStatus.AVAILABLE);
            assigned = parkingSpotRepository.countByStatusAndActiveTrue(ParkingSpotStatus.ASSIGNED);
            underMaintenance = parkingSpotRepository.countByStatusAndActiveTrue(ParkingSpotStatus.UNDER_MAINTENANCE);
        }

        return ParkingSpotCountsResponse.of(available, assigned, underMaintenance);
    }

    @Override
    @Transactional
    public ParkingSpotResponse assignToTenant(UUID parkingSpotId, UUID tenantId) {
        log.info("Assigning parking spot {} to tenant {}", parkingSpotId, tenantId);

        ParkingSpot parkingSpot = findParkingSpotById(parkingSpotId);

        // Validate spot is available
        if (!parkingSpot.isAvailable()) {
            throw new ValidationException("Parking spot is not available for assignment. " +
                    "Current status: " + parkingSpot.getStatus());
        }

        // Validate tenant exists
        Tenant tenant = tenantRepository.findById(tenantId)
                .orElseThrow(() -> new ResourceNotFoundException("Tenant not found with ID: " + tenantId));

        // Assign spot
        parkingSpot.assignToTenant(tenant);
        parkingSpot = parkingSpotRepository.save(parkingSpot);

        log.info("Parking spot {} assigned to tenant {}", parkingSpotId, tenantId);
        return ParkingSpotResponse.fromEntity(parkingSpot);
    }

    @Override
    @Transactional
    public ParkingSpotResponse releaseParkingSpot(UUID parkingSpotId) {
        log.info("Releasing parking spot: {}", parkingSpotId);

        ParkingSpot parkingSpot = findParkingSpotById(parkingSpotId);

        // Release spot
        parkingSpot.release();
        parkingSpot = parkingSpotRepository.save(parkingSpot);

        log.info("Parking spot released: {}", parkingSpotId);
        return ParkingSpotResponse.fromEntity(parkingSpot);
    }

    @Override
    @Transactional
    public void releaseAllParkingSpotsForTenant(UUID tenantId) {
        log.info("Releasing all parking spots for tenant: {}", tenantId);

        List<ParkingSpot> assignedSpots = parkingSpotRepository.findByAssignedTenantIdAndActiveTrue(tenantId);

        for (ParkingSpot spot : assignedSpots) {
            spot.release();
            parkingSpotRepository.save(spot);
            log.debug("Released parking spot: {}", spot.getId());
        }

        log.info("Released {} parking spot(s) for tenant: {}", assignedSpots.size(), tenantId);
    }

    // =====================================================================
    // Private Helper Methods
    // =====================================================================

    private ParkingSpot findParkingSpotById(UUID id) {
        return parkingSpotRepository.findByIdAndActiveTrue(id)
                .orElseThrow(() -> new ResourceNotFoundException("Parking spot not found with ID: " + id));
    }

    // Specification builders for dynamic queries
    private Specification<ParkingSpot> isActive() {
        return (root, query, cb) -> cb.isTrue(root.get("active"));
    }

    private Specification<ParkingSpot> hasPropertyId(UUID propertyId) {
        return (root, query, cb) -> cb.equal(root.get("property").get("id"), propertyId);
    }

    private Specification<ParkingSpot> hasStatus(ParkingSpotStatus status) {
        return (root, query, cb) -> cb.equal(root.get("status"), status);
    }

    private Specification<ParkingSpot> searchBySpotNumberOrTenantName(String search) {
        return (root, query, cb) -> {
            String pattern = "%" + search.toLowerCase() + "%";
            return cb.or(
                    cb.like(cb.lower(root.get("spotNumber")), pattern),
                    cb.like(
                            cb.lower(cb.concat(
                                    cb.concat(root.get("assignedTenant").get("firstName"), " "),
                                    root.get("assignedTenant").get("lastName")
                            )),
                            pattern
                    )
            );
        };
    }
}
