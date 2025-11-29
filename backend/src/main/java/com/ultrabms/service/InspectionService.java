package com.ultrabms.service;

import com.ultrabms.dto.compliance.CreateInspectionDto;
import com.ultrabms.dto.compliance.InspectionDto;
import com.ultrabms.dto.compliance.InspectionListDto;
import com.ultrabms.dto.compliance.UpdateInspectionDto;
import com.ultrabms.entity.enums.InspectionStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

/**
 * Service interface for Inspection operations.
 * Handles inspection CRUD, scheduling, and work order integration.
 *
 * Story 7.3: Compliance and Inspection Tracking
 * AC #19: POST /api/v1/inspections/schedule
 * AC #20: GET /api/v1/inspections
 * AC #27: Create work order on failed inspection
 */
public interface InspectionService {

    /**
     * Schedule a new inspection
     *
     * @param dto CreateInspectionDto with inspection data
     * @param scheduledBy User UUID who scheduled it
     * @return Created inspection DTO
     */
    InspectionDto scheduleInspection(CreateInspectionDto dto, UUID scheduledBy);

    /**
     * Get inspection by ID
     *
     * @param id Inspection UUID
     * @return Inspection DTO with details
     */
    InspectionDto getInspectionById(UUID id);

    /**
     * Get paginated list of inspections with filters
     *
     * @param propertyId Optional property filter
     * @param scheduleId Optional schedule filter
     * @param status Optional status filter
     * @param fromDate Optional date range start
     * @param toDate Optional date range end
     * @param pageable Pagination parameters
     * @return Page of inspection list DTOs
     */
    Page<InspectionListDto> getAllInspections(
            UUID propertyId,
            UUID scheduleId,
            InspectionStatus status,
            LocalDate fromDate,
            LocalDate toDate,
            Pageable pageable
    );

    /**
     * Update inspection (record results)
     *
     * @param id Inspection UUID
     * @param dto UpdateInspectionDto with results
     * @param updatedBy User UUID who updated it
     * @return Updated inspection DTO
     */
    InspectionDto updateInspection(UUID id, UpdateInspectionDto dto, UUID updatedBy);

    /**
     * Cancel an inspection
     *
     * @param id Inspection UUID
     * @param reason Cancellation reason
     * @param cancelledBy User UUID who cancelled it
     * @return Updated inspection DTO
     */
    InspectionDto cancelInspection(UUID id, String reason, UUID cancelledBy);

    /**
     * Get upcoming inspections (next N days)
     *
     * @param days Number of days
     * @return List of upcoming inspection DTOs
     */
    List<InspectionListDto> getUpcomingInspections(int days);

    /**
     * Get inspections by property
     *
     * @param propertyId Property UUID
     * @param pageable Pagination parameters
     * @return Page of inspection list DTOs
     */
    Page<InspectionListDto> getInspectionsByProperty(UUID propertyId, Pageable pageable);
}
