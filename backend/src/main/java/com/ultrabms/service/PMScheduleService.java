package com.ultrabms.service;

import com.ultrabms.dto.pmschedules.CreatePMScheduleDto;
import com.ultrabms.dto.pmschedules.CreatePMScheduleResponseDto;
import com.ultrabms.dto.pmschedules.GenerateNowResponseDto;
import com.ultrabms.dto.pmschedules.GeneratedWorkOrderDto;
import com.ultrabms.dto.pmschedules.PMScheduleListDto;
import com.ultrabms.dto.pmschedules.PMScheduleResponseDto;
import com.ultrabms.dto.pmschedules.PMScheduleStatisticsDto;
import com.ultrabms.dto.pmschedules.UpdatePMScheduleDto;
import com.ultrabms.entity.PMSchedule;
import com.ultrabms.entity.enums.PMScheduleStatus;
import com.ultrabms.entity.enums.RecurrenceType;
import com.ultrabms.entity.enums.WorkOrderCategory;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.util.List;
import java.util.UUID;

/**
 * Service interface for PMSchedule business logic.
 * Story 4.2: Preventive Maintenance Scheduling
 */
public interface PMScheduleService {

    // =========================================================================
    // CRUD OPERATIONS
    // =========================================================================

    /**
     * Create a new PM schedule.
     *
     * @param dto PM schedule creation data
     * @param createdBy Authenticated user ID
     * @return Created PM schedule response
     */
    CreatePMScheduleResponseDto createPMSchedule(CreatePMScheduleDto dto, UUID createdBy);

    /**
     * Get PM schedule by ID with full details and statistics.
     *
     * @param id PM schedule ID
     * @return PM schedule response with statistics
     */
    PMScheduleResponseDto getPMScheduleById(UUID id);

    /**
     * Get paginated list of PM schedules with filters.
     *
     * @param propertyId Optional property filter
     * @param statuses Optional status filter
     * @param categories Optional category filter
     * @param recurrenceTypes Optional recurrence type filter
     * @param searchTerm Optional search term for schedule name
     * @param pageable Pagination parameters
     * @return Page of PM schedule list items
     */
    Page<PMScheduleListDto> getPMSchedules(
            UUID propertyId,
            List<PMScheduleStatus> statuses,
            List<WorkOrderCategory> categories,
            List<RecurrenceType> recurrenceTypes,
            String searchTerm,
            Pageable pageable
    );

    /**
     * Update PM schedule details.
     * Note: propertyId, recurrenceType, and startDate cannot be updated.
     *
     * @param id PM schedule ID
     * @param dto Update data
     * @return Updated PM schedule response
     */
    PMScheduleResponseDto updatePMSchedule(UUID id, UpdatePMScheduleDto dto);

    /**
     * Update PM schedule status (pause, resume, complete).
     *
     * @param id PM schedule ID
     * @param status New status
     * @return Updated PM schedule response
     */
    PMScheduleResponseDto updatePMScheduleStatus(UUID id, PMScheduleStatus status);

    /**
     * Soft delete a PM schedule.
     * Only allowed if no work orders have been generated.
     *
     * @param id PM schedule ID
     */
    void deletePMSchedule(UUID id);

    // =========================================================================
    // WORK ORDER GENERATION
    // =========================================================================

    /**
     * Manually generate a work order from PM schedule immediately.
     * Does NOT affect the nextGenerationDate (manual generation is extra).
     *
     * @param id PM schedule ID
     * @param generatedBy User ID who triggered the generation
     * @return Generated work order info
     */
    GenerateNowResponseDto generateWorkOrderNow(UUID id, UUID generatedBy);

    /**
     * Process all PM schedules due for automatic work order generation.
     * Called by scheduled job.
     *
     * @return Number of work orders generated
     */
    int processScheduledGenerations();

    // =========================================================================
    // HISTORY AND STATISTICS
    // =========================================================================

    /**
     * Get paginated history of work orders generated from this PM schedule.
     *
     * @param id PM schedule ID
     * @param pageable Pagination parameters
     * @return Page of generated work orders
     */
    Page<GeneratedWorkOrderDto> getPMScheduleHistory(UUID id, Pageable pageable);

    /**
     * Calculate statistics for a PM schedule.
     *
     * @param id PM schedule ID
     * @return Statistics DTO
     */
    PMScheduleStatisticsDto calculateStatistics(UUID id);

    // =========================================================================
    // INTERNAL HELPER METHODS
    // =========================================================================

    /**
     * Calculate next generation date based on current date and recurrence type.
     *
     * @param schedule PM schedule entity
     * @return Calculated next generation date, or null if schedule should end
     */
    java.time.LocalDate calculateNextGenerationDate(PMSchedule schedule);
}
