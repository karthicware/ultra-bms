package com.ultrabms.service;

import com.ultrabms.dto.compliance.ComplianceScheduleDto;
import com.ultrabms.dto.compliance.ComplianceScheduleListDto;
import com.ultrabms.dto.compliance.CompleteScheduleDto;
import com.ultrabms.entity.enums.ComplianceCategory;
import com.ultrabms.entity.enums.ComplianceScheduleStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.util.UUID;

/**
 * Service interface for Compliance Schedule operations.
 * Handles schedule management and auto-generation.
 *
 * Story 7.3: Compliance and Inspection Tracking
 * AC #16: GET /api/v1/compliance/schedules
 * AC #17: GET /api/v1/compliance/schedules/{id}
 * AC #18: PUT /api/v1/compliance/schedules/{id}/complete
 * AC #24: Auto-generate schedules based on frequency
 * AC #25: Update schedule status based on due dates
 */
public interface ComplianceScheduleService {

    /**
     * Get paginated list of schedules with filters
     *
     * @param propertyId Optional property filter
     * @param category Optional category filter
     * @param status Optional status filter
     * @param pageable Pagination parameters
     * @return Page of schedule list DTOs
     */
    Page<ComplianceScheduleListDto> getAllSchedules(
            UUID propertyId,
            ComplianceCategory category,
            ComplianceScheduleStatus status,
            Pageable pageable
    );

    /**
     * Get schedule by ID
     *
     * @param id Schedule UUID
     * @return Schedule DTO with details
     */
    ComplianceScheduleDto getScheduleById(UUID id);

    /**
     * Complete a schedule (marks as completed)
     *
     * @param id Schedule UUID
     * @param dto CompleteScheduleDto with completion data
     * @param completedBy User UUID who completed it
     * @return Updated schedule DTO
     */
    ComplianceScheduleDto completeSchedule(UUID id, CompleteScheduleDto dto, UUID completedBy);

    /**
     * Generate schedules for a property based on requirements
     * Called when a new property is created or requirements change
     *
     * @param propertyId Property UUID
     */
    void generateSchedulesForProperty(UUID propertyId);

    /**
     * Generate next schedule after completion (based on frequency)
     *
     * @param completedScheduleId The completed schedule ID
     */
    void generateNextSchedule(UUID completedScheduleId);

    /**
     * Update all schedule statuses based on due dates
     * Called by scheduler job
     */
    void updateScheduleStatuses();

    /**
     * Mark schedule as exempt
     *
     * @param id Schedule UUID
     * @param reason Exemption reason
     * @param exemptedBy User UUID
     * @return Updated schedule DTO
     */
    ComplianceScheduleDto markAsExempt(UUID id, String reason, UUID exemptedBy);
}
