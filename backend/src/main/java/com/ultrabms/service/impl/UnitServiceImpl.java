package com.ultrabms.service.impl;

import com.ultrabms.dto.units.BulkCreateUnitsRequest;
import com.ultrabms.dto.units.BulkUpdateStatusRequest;
import com.ultrabms.dto.units.CreateUnitRequest;
import com.ultrabms.dto.units.UnitHistoryResponse;
import com.ultrabms.dto.units.UnitResponse;
import com.ultrabms.dto.units.UpdateUnitRequest;
import com.ultrabms.dto.units.UpdateUnitStatusRequest;
import com.ultrabms.entity.Property;
import com.ultrabms.entity.Unit;
import com.ultrabms.entity.UnitHistory;
import com.ultrabms.entity.User;
import com.ultrabms.entity.enums.UnitStatus;
import com.ultrabms.exception.ResourceNotFoundException;
import com.ultrabms.exception.ValidationException;
import com.ultrabms.repository.PropertyRepository;
import com.ultrabms.repository.UnitHistoryRepository;
import com.ultrabms.repository.UnitRepository;
import com.ultrabms.repository.UserRepository;
import com.ultrabms.service.UnitService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.UUID;
import java.util.stream;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class UnitServiceImpl implements UnitService {
    private final UnitRepository unitRepository;
    private final PropertyRepository propertyRepository;
    private final UnitHistoryRepository unitHistoryRepository;
    private final UserRepository userRepository;

    // Status transition rules
    private static final Map<UnitStatus, Set<UnitStatus>> VALID_TRANSITIONS = Map.of(
            UnitStatus.AVAILABLE, Set.of(UnitStatus.RESERVED, UnitStatus.UNDER_MAINTENANCE),
            UnitStatus.RESERVED, Set.of(UnitStatus.OCCUPIED, UnitStatus.AVAILABLE, UnitStatus.UNDER_MAINTENANCE),
            UnitStatus.OCCUPIED, Set.of(UnitStatus.AVAILABLE, UnitStatus.UNDER_MAINTENANCE),
            UnitStatus.UNDER_MAINTENANCE, Set.of(UnitStatus.AVAILABLE, UnitStatus.RESERVED)
    );

    @Override
    @Transactional
    public UnitResponse createUnit(CreateUnitRequest request, UUID createdBy) {
        log.info("Creating new unit: {} for property: {}", request.getUnitNumber(), request.getPropertyId());

        Property property = findPropertyById(request.getPropertyId());

        if (unitRepository.findByPropertyIdAndUnitNumber(request.getPropertyId(), request.getUnitNumber()).isPresent()) {
            throw new ValidationException("Unit with this number already exists in the property");
        }

        Unit unit = Unit.builder()
                .property(property)
                .unitNumber(request.getUnitNumber())
                .floor(request.getFloor())
                .bedroomCount(request.getBedroomCount())
                .bathroomCount(request.getBathroomCount() != null ? request.getBathroomCount().intValue() : null)
                .squareFootage(request.getSquareFootage())
                .monthlyRent(request.getMonthlyRent())
                .features(request.getFeatures())
                .status(UnitStatus.AVAILABLE)
                .createdBy(createdBy)
                .build();

        unit = unitRepository.save(unit);
        log.info("Unit created successfully: {}", unit.getUnitNumber());
        return UnitResponse.fromEntity(unit);
    }

    @Override
    @Transactional
    public BulkCreateResult bulkCreateUnits(BulkCreateUnitsRequest request, UUID createdBy) {
        log.info("Bulk creating {} units for property: {}", request.getCount(), request.getPropertyId());

        Property property = findPropertyById(request.getPropertyId());

        List<UnitResponse> createdUnits = new ArrayList<>();
        List<String> errors = new ArrayList<>();
        int successCount = 0;
        int failureCount = 0;

        // Generate unit numbers based on increment pattern
        List<String> unitNumbers = generateUnitNumbers(
                request.getStartingUnitNumber(),
                request.getCount(),
                request.getIncrementPattern(),
                request.getFloor()
        );

        for (String unitNumber : unitNumbers) {
            try {
                if (unitRepository.findByPropertyIdAndUnitNumber(request.getPropertyId(), unitNumber).isPresent()) {
                    errors.add("Unit " + unitNumber + " already exists");
                    failureCount++;
                    continue;
                }

                Unit unit = Unit.builder()
                        .property(property)
                        .unitNumber(unitNumber)
                        .floor(request.getFloor())
                        .bedroomCount(request.getBedroomCount())
                        .bathroomCount(request.getBathroomCount() != null ? request.getBathroomCount().intValue() : null)
                        .squareFootage(request.getSquareFootage())
                        .monthlyRent(request.getMonthlyRent())
                        .features(request.getFeatures())
                        .status(UnitStatus.AVAILABLE)
                        .createdBy(createdBy)
                        .build();

                unit = unitRepository.save(unit);
                createdUnits.add(UnitResponse.fromEntity(unit));
                successCount++;
            } catch (Exception e) {
                log.error("Error creating unit {}: {}", unitNumber, e.getMessage());
                errors.add("Failed to create unit " + unitNumber + ": " + e.getMessage());
                failureCount++;
            }
        }

        log.info("Bulk create completed: {} succeeded, {} failed", successCount, failureCount);
        return BulkCreateResult.builder()
                .totalRequested(request.getCount())
                .successCount(successCount)
                .failureCount(failureCount)
                .createdUnits(createdUnits)
                .errors(errors)
                .build();
    }

    @Override
    @Transactional(readOnly = true)
    public UnitResponse getUnitById(UUID id) {
        log.info("Fetching unit by ID: {}", id);
        Unit unit = findUnitById(id);
        return UnitResponse.fromEntity(unit);
    }

    @Override
    @Transactional
    public UnitResponse updateUnit(UUID id, UpdateUnitRequest request) {
        log.info("Updating unit: {}", id);

        Unit unit = findUnitById(id);

        if (request.getUnitNumber() != null) {
            if (!request.getUnitNumber().equals(unit.getUnitNumber()) &&
                    unitRepository.findByPropertyIdAndUnitNumber(
                            unit.getProperty().getId(),
                            request.getUnitNumber()
                    ).isPresent()) {
                throw new ValidationException("Unit with this number already exists in the property");
            }
            unit.setUnitNumber(request.getUnitNumber());
        }
        if (request.getFloor() != null) {
            unit.setFloor(request.getFloor());
        }
        if (request.getBedroomCount() != null) {
            unit.setBedroomCount(request.getBedroomCount());
        }
        if (request.getBathroomCount() != null) {
            unit.setBathroomCount(request.getBathroomCount().intValue());
        }
        if (request.getSquareFootage() != null) {
            unit.setSquareFootage(request.getSquareFootage());
        }
        if (request.getMonthlyRent() != null) {
            unit.setMonthlyRent(request.getMonthlyRent());
        }
        if (request.getFeatures() != null) {
            unit.setFeatures(request.getFeatures());
        }

        unit = unitRepository.save(unit);
        log.info("Unit updated successfully: {}", unit.getUnitNumber());
        return UnitResponse.fromEntity(unit);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<UnitResponse> searchUnits(
            UUID propertyId,
            UnitStatus status,
            Integer bedroomCount,
            BigDecimal minRent,
            BigDecimal maxRent,
            String search,
            Pageable pageable
    ) {
        log.info("Searching units with filters");

        Specification<Unit> spec = Specification.where(null);

        // Only show active units by default
        spec = spec.and((root, query, cb) -> cb.equal(root.get("active"), true));

        if (propertyId != null) {
            spec = spec.and((root, query, cb) -> cb.equal(root.get("property").get("id"), propertyId));
        }
        if (status != null) {
            spec = spec.and((root, query, cb) -> cb.equal(root.get("status"), status));
        }
        if (bedroomCount != null) {
            spec = spec.and((root, query, cb) -> cb.equal(root.get("bedroomCount"), bedroomCount));
        }
        if (minRent != null) {
            spec = spec.and((root, query, cb) -> cb.greaterThanOrEqualTo(root.get("monthlyRent"), minRent));
        }
        if (maxRent != null) {
            spec = spec.and((root, query, cb) -> cb.lessThanOrEqualTo(root.get("monthlyRent"), maxRent));
        }
        if (search != null && !search.trim().isEmpty()) {
            String searchTerm = "%" + search.toLowerCase() + "%";
            spec = spec.and((root, query, cb) ->
                    cb.like(cb.lower(root.get("unitNumber")), searchTerm)
            );
        }

        return unitRepository.findAll(spec, pageable)
                .map(UnitResponse::fromEntity);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<UnitResponse> getUnitsByProperty(UUID propertyId, Pageable pageable) {
        log.info("Fetching units for property: {}", propertyId);
        findPropertyById(propertyId); // Validate property exists

        Specification<Unit> spec = Specification.where(null);
        spec = spec.and((root, query, cb) -> cb.equal(root.get("property").get("id"), propertyId));
        spec = spec.and((root, query, cb) -> cb.equal(root.get("active"), true));

        return unitRepository.findAll(spec, pageable)
                .map(UnitResponse::fromEntity);
    }

    @Override
    @Transactional(readOnly = true)
    public List<UnitResponse> getAvailableUnits(UUID propertyId) {
        log.info("Fetching available units for property: {}", propertyId);
        findPropertyById(propertyId); // Validate property exists
        return unitRepository.findByPropertyIdAndStatus(propertyId, UnitStatus.AVAILABLE)
                .stream()
                .filter(Unit::getActive)
                .map(UnitResponse::fromEntity)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional
    public UnitResponse updateUnitStatus(UUID id, UpdateUnitStatusRequest request, UUID updatedBy) {
        log.info("Updating unit status: {} to {}", id, request.getNewStatus());

        Unit unit = findUnitById(id);
        UnitStatus oldStatus = unit.getStatus();
        UnitStatus newStatus = request.getNewStatus();

        if (!isValidStatusTransition(oldStatus, newStatus)) {
            throw new ValidationException(
                    String.format("Invalid status transition from %s to %s", oldStatus, newStatus)
            );
        }

        unit.setStatus(newStatus);
        unit = unitRepository.save(unit);

        createHistoryEntry(unit, oldStatus, newStatus, request.getReason(), updatedBy);

        log.info("Unit status updated successfully: {} -> {}", oldStatus, newStatus);
        return UnitResponse.fromEntity(unit);
    }

    @Override
    @Transactional
    public BulkUpdateResult bulkUpdateUnitStatus(BulkUpdateStatusRequest request, UUID updatedBy) {
        log.info("Bulk updating status for {} units to {}", request.getUnitIds().size(), request.getNewStatus());

        List<UUID> updatedUnitIds = new ArrayList<>();
        List<UUID> failedUnitIds = new ArrayList<>();
        List<String> errors = new ArrayList<>();
        int successCount = 0;
        int failureCount = 0;

        for (UUID unitId : request.getUnitIds()) {
            try {
                Unit unit = findUnitById(unitId);
                UnitStatus oldStatus = unit.getStatus();
                UnitStatus newStatus = request.getNewStatus();

                if (!isValidStatusTransition(oldStatus, newStatus)) {
                    errors.add("Unit " + unit.getUnitNumber() + ": Invalid transition from " + oldStatus + " to " + newStatus);
                    failedUnitIds.add(unitId);
                    failureCount++;
                    continue;
                }

                unit.setStatus(newStatus);
                unit = unitRepository.save(unit);

                createHistoryEntry(unit, oldStatus, newStatus, request.getReason(), updatedBy);

                updatedUnitIds.add(unitId);
                successCount++;
            } catch (Exception e) {
                log.error("Error updating unit {}: {}", unitId, e.getMessage());
                errors.add("Unit " + unitId + ": " + e.getMessage());
                failedUnitIds.add(unitId);
                failureCount++;
            }
        }

        log.info("Bulk update completed: {} succeeded, {} failed", successCount, failureCount);
        return BulkUpdateResult.builder()
                .totalRequested(request.getUnitIds().size())
                .successCount(successCount)
                .failureCount(failureCount)
                .updatedUnitIds(updatedUnitIds)
                .failedUnitIds(failedUnitIds)
                .errors(errors)
                .build();
    }

    @Override
    @Transactional(readOnly = true)
    public List<UnitHistoryResponse> getUnitHistory(UUID unitId) {
        log.info("Fetching history for unit: {}", unitId);
        findUnitById(unitId); // Validate unit exists
        return unitHistoryRepository.findByUnitIdOrderByChangedAtDesc(unitId)
                .stream()
                .map(UnitHistoryResponse::fromEntity)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public Map<UnitStatus, Long> getUnitStatusDistribution(UUID propertyId) {
        log.info("Fetching unit status distribution for property: {}", propertyId);
        findPropertyById(propertyId); // Validate property exists

        Map<UnitStatus, Long> distribution = new HashMap<>();
        for (UnitStatus status : UnitStatus.values()) {
            long count = unitRepository.countByPropertyIdAndStatus(propertyId, status);
            distribution.put(status, count);
        }

        return distribution;
    }

    @Override
    @Transactional
    public void deleteUnit(UUID id) {
        log.info("Soft deleting unit: {}", id);
        Unit unit = findUnitById(id);

        if (unit.getStatus() == UnitStatus.OCCUPIED) {
            throw new ValidationException("Cannot delete an occupied unit");
        }

        unit.setActive(false);
        unitRepository.save(unit);
        log.info("Unit soft deleted successfully: {}", id);
    }

    @Override
    @Transactional
    public UnitResponse restoreUnit(UUID id) {
        log.info("Restoring unit: {}", id);
        Unit unit = unitRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Unit not found with ID: " + id));

        unit.setActive(true);
        unit = unitRepository.save(unit);
        log.info("Unit restored successfully: {}", id);
        return UnitResponse.fromEntity(unit);
    }

    @Override
    public boolean isValidStatusTransition(UnitStatus currentStatus, UnitStatus newStatus) {
        if (currentStatus == newStatus) {
            return true; // Same status is always valid
        }
        Set<UnitStatus> validNextStatuses = VALID_TRANSITIONS.get(currentStatus);
        return validNextStatuses != null && validNextStatuses.contains(newStatus);
    }

    private Property findPropertyById(UUID id) {
        return propertyRepository.findById(id)
                .filter(Property::getActive)
                .orElseThrow(() -> new ResourceNotFoundException("Property not found with ID: " + id));
    }

    private Unit findUnitById(UUID id) {
        return unitRepository.findById(id)
                .filter(Unit::getActive)
                .orElseThrow(() -> new ResourceNotFoundException("Unit not found with ID: " + id));
    }

    private void createHistoryEntry(
            Unit unit,
            UnitStatus oldStatus,
            UnitStatus newStatus,
            String reason,
            UUID changedBy
    ) {
        // Fetch user who made the change
        User changer = userRepository.findById(changedBy)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with ID: " + changedBy));

        UnitHistory history = UnitHistory.builder()
                .unit(unit)
                .oldStatus(oldStatus)
                .newStatus(newStatus)
                .reason(reason)
                .changedBy(changer)
                .build();
        unitHistoryRepository.save(history);
    }

    private List<String> generateUnitNumbers(
            String startingNumber,
            int count,
            BulkCreateUnitsRequest.IncrementPattern pattern,
            Integer floor
    ) {
        List<String> unitNumbers = new ArrayList<>();

        switch (pattern) {
            case SEQUENTIAL:
                // Parse starting number as integer and increment
                try {
                    int startNum = Integer.parseInt(startingNumber);
                    for (int i = 0; i < count; i++) {
                        unitNumbers.add(String.valueOf(startNum + i));
                    }
                } catch (NumberFormatException e) {
                    // If not a number, try alphanumeric increment
                    unitNumbers.add(startingNumber);
                    for (int i = 1; i < count; i++) {
                        unitNumbers.add(startingNumber + i);
                    }
                }
                break;

            case FLOOR_BASED:
                // Generate floor-based numbers like 0101, 0102, etc.
                if (floor != null) {
                    String floorPrefix = String.format("%02d", floor);
                    int startUnit = 1;
                    // Try to extract unit number from starting number
                    try {
                        if (startingNumber.length() > 2) {
                            startUnit = Integer.parseInt(startingNumber.substring(2));
                        }
                    } catch (NumberFormatException e) {
                        // Use default start unit
                    }
                    for (int i = 0; i < count; i++) {
                        unitNumbers.add(String.format("%s%02d", floorPrefix, startUnit + i));
                    }
                } else {
                    throw new ValidationException("Floor is required for FLOOR_BASED increment pattern");
                }
                break;

            case CUSTOM:
                // For custom, just use the starting number and append sequence
                for (int i = 0; i < count; i++) {
                    unitNumbers.add(startingNumber + "-" + (i + 1));
                }
                break;

            default:
                throw new ValidationException("Unsupported increment pattern: " + pattern);
        }

        return unitNumbers;
    }
}
