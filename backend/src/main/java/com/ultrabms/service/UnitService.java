package com.ultrabms.service;

import com.ultrabms.dto.units.*;
import com.ultrabms.entity.enums.UnitStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;
import java.util.UUID;

/**
 * Service interface for Unit management
 */
public interface UnitService {

    /**
     * Create a new unit
     */
    UnitResponse createUnit(CreateUnitRequest request, UUID createdBy);

    /**
     * Bulk create units
     */
    BulkCreateResult bulkCreateUnits(BulkCreateUnitsRequest request, UUID createdBy);

    /**
     * Get unit by ID
     */
    UnitResponse getUnitById(UUID id);

    /**
     * Update existing unit
     */
    UnitResponse updateUnit(UUID id, UpdateUnitRequest request);

    /**
     * Search units with filters
     */
    Page<UnitResponse> searchUnits(
            UUID propertyId,
            UnitStatus status,
            Integer bedroomCount,
            BigDecimal minRent,
            BigDecimal maxRent,
            String search,
            Pageable pageable
    );

    /**
     * Get all units for a property
     */
    Page<UnitResponse> getUnitsByProperty(UUID propertyId, Pageable pageable);

    /**
     * Get available units for a property
     */
    List<UnitResponse> getAvailableUnits(UUID propertyId);

    /**
     * Update unit status
     */
    UnitResponse updateUnitStatus(UUID id, UpdateUnitStatusRequest request, UUID updatedBy);

    /**
     * Bulk update unit status
     */
    BulkUpdateResult bulkUpdateUnitStatus(BulkUpdateStatusRequest request, UUID updatedBy);

    /**
     * Get unit history
     */
    List<UnitHistoryResponse> getUnitHistory(UUID unitId);

    /**
     * Get unit status distribution for a property
     */
    Map<UnitStatus, Long> getUnitStatusDistribution(UUID propertyId);

    /**
     * Soft delete unit (set active = false)
     */
    void deleteUnit(UUID id);

    /**
     * Restore soft deleted unit (set active = true)
     */
    UnitResponse restoreUnit(UUID id);

    /**
     * Validate status transition
     */
    boolean isValidStatusTransition(UnitStatus currentStatus, UnitStatus newStatus);
}
