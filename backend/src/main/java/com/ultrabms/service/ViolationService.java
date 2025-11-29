package com.ultrabms.service;

import com.ultrabms.dto.compliance.CreateViolationDto;
import com.ultrabms.dto.compliance.UpdateViolationDto;
import com.ultrabms.dto.compliance.ViolationDto;
import com.ultrabms.dto.compliance.ViolationListDto;
import com.ultrabms.entity.enums.FineStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

/**
 * Service interface for Violation operations.
 * Handles violation CRUD and fine tracking.
 *
 * Story 7.3: Compliance and Inspection Tracking
 * AC #21: POST /api/v1/violations
 * AC #22: PUT /api/v1/violations/{id}
 * AC #26: Track fines and resolutions
 */
public interface ViolationService {

    /**
     * Record a new violation
     *
     * @param dto CreateViolationDto with violation data
     * @param recordedBy User UUID who recorded it
     * @return Created violation DTO
     */
    ViolationDto createViolation(CreateViolationDto dto, UUID recordedBy);

    /**
     * Get violation by ID
     *
     * @param id Violation UUID
     * @return Violation DTO with details
     */
    ViolationDto getViolationById(UUID id);

    /**
     * Get paginated list of violations with filters
     *
     * @param propertyId Optional property filter
     * @param scheduleId Optional schedule filter
     * @param fineStatus Optional fine status filter
     * @param fromDate Optional date range start
     * @param toDate Optional date range end
     * @param pageable Pagination parameters
     * @return Page of violation list DTOs
     */
    Page<ViolationListDto> getAllViolations(
            UUID propertyId,
            UUID scheduleId,
            FineStatus fineStatus,
            LocalDate fromDate,
            LocalDate toDate,
            Pageable pageable
    );

    /**
     * Update violation (update fine status, resolution, etc.)
     *
     * @param id Violation UUID
     * @param dto UpdateViolationDto with updated data
     * @param updatedBy User UUID who updated it
     * @return Updated violation DTO
     */
    ViolationDto updateViolation(UUID id, UpdateViolationDto dto, UUID updatedBy);

    /**
     * Get recent violations (last N days)
     *
     * @param days Number of days
     * @return List of recent violation DTOs
     */
    List<ViolationListDto> getRecentViolations(int days);

    /**
     * Get violations by property
     *
     * @param propertyId Property UUID
     * @param pageable Pagination parameters
     * @return Page of violation list DTOs
     */
    Page<ViolationListDto> getViolationsByProperty(UUID propertyId, Pageable pageable);

    /**
     * Get count of pending fines
     *
     * @return Count of violations with PENDING fine status
     */
    long countPendingFines();
}
